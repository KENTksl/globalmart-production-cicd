# GlobalMart v2 — Terraform Infrastructure (Multi-AZ)

Hạ tầng AWS Production cho GlobalMart v2 với kiến trúc **Multi-AZ High Availability**.

## Điểm khác biệt v2 so với v1

| Thành phần | v1 | v2 |
|---|---|---|
| Availability Zones | 1 AZ | **2 AZ** |
| NAT Gateway | 1 cái | **2 cái** (1 per AZ) |
| Route Tables Private | 1 RT chung | **2 RT** (mỗi AZ 1 cái) |
| ECS Backend | AZ-A cùng Frontend | **AZ-B** (phân tán) |
| RDS | Single-AZ | **Multi-AZ** (Primary + Standby) |
| RDS Proxy | Không có | **Có** (connection pooling + failover trong suốt) |
| Security Groups | 5 SGs | **6 SGs** (thêm sg-rds-proxy) |
| CloudWatch Alarms | 6 alarms | **8 alarms** (thêm Proxy + Failover) |

## Cấu trúc thư mục

```
globalmart-terraform-v2/
├── main.tf                     # Root — gọi 9 modules
├── variables.tf                # Khai báo biến
├── outputs.tf                  # Outputs sau apply
├── terraform.tfvars.example    # Template — copy thành terraform.tfvars
├── buildspec.yml               # Copy vào root GitHub repo
├── appspec.yml                 # Copy vào root GitHub repo
├── taskdef.json                # Copy vào root GitHub repo (cập nhật ACCOUNT_ID)
└── modules/
    ├── iam/          # IAM Roles: Pipeline, CodeBuild, ECS, CodeDeploy, RDS Monitor
    ├── vpc/          # VPC + 4 Subnets + IGW + 2 NAT GW + 2 Route Tables + 6 SGs
    ├── ecr/          # ECR Frontend + Backend (scan on push, lifecycle)
    ├── s3/           # Artifact bucket + Backup bucket + ALB logs bucket
    ├── rds/          # RDS MySQL Multi-AZ + RDS Proxy + Secrets Manager
    ├── ecs/          # ECS Cluster + ALB Public/Internal + Services (FE=AZ-A, BE=AZ-B)
    ├── codepipeline/ # CodeBuild + CodeDeploy + Pipeline 3 stages
    ├── monitoring/   # SNS + 8 Alarms + EventBridge + Dashboard (9 widgets)
    └── backup/       # AWS Backup Plan (daily 7d + weekly 90d) + RDS Export Role
```

## Luồng traffic

```
Internet
    │
    ▼
ALB Public (span AZ-A + AZ-B) — port 80/443
    │
    ▼ (port 3000)
ECS Frontend  ←── private-subnet-a (AZ-A)
    │
    ▼ (HTTP → ALB Internal port 80)
ALB Internal (span AZ-A + AZ-B)
    │
    ▼ (port 8080)
ECS Backend   ←── private-subnet-b (AZ-B)
    │
    ▼ (MySQL 3306)
RDS Proxy     ←── span AZ-A + AZ-B  [connection pooling]
    │
    ▼
RDS Primary (AZ-A)  ←──sync──► RDS Standby (AZ-B)
                                [auto-failover nếu AZ-A die]
```

## Hướng dẫn deploy

### Bước 1 — Chuẩn bị

```bash
# Cài Terraform >= 1.5.0
terraform version

# Cấu hình AWS credentials
aws configure
# Region: ap-southeast-1
```

### Bước 2 — Tạo GitHub Connection (1 lần trên Console)

1. AWS Console → **Developer Tools → Connections**
2. **Create connection** → GitHub
3. Tên: `globalmart-github`
4. Install AWS Connector for GitHub → chọn repo
5. Copy **Connection ARN** → dán vào `terraform.tfvars`

### Bước 3 — Cấu hình biến

```bash
cp terraform.tfvars.example terraform.tfvars
# Mở terraform.tfvars, điền:
#   github_owner, github_repo
#   github_connection_arn  ← ARN từ bước 2
#   alert_email
```

### Bước 4 — Copy files vào GitHub repo

```
buildspec.yml  →  root của repo
appspec.yml    →  root của repo
taskdef.json   →  root của repo  (cập nhật ACCOUNT_ID trước)
```

### Bước 5 — Deploy

```bash
terraform init     # tải providers (aws + random)
terraform plan     # xem trước ~80 resources
terraform apply    # nhập 'yes' — đợi ~20 phút
```

> **Lưu ý:** RDS Multi-AZ và RDS Proxy mất nhiều thời gian nhất (~15 phút).

### Bước 6 — Sau khi apply

```bash
# Xem outputs
terraform output

# URL truy cập app
terraform output alb_public_dns

# RDS Proxy endpoint (sensitive)
terraform output -json rds_proxy_endpoint
```

1. **Confirm SNS email** — vào hộp thư, click link xác nhận từ AWS
2. **Push image** lần đầu để ECS có image mà chạy:

```bash
# Login ECR
aws ecr get-login-password --region ap-southeast-1 | \
  docker login --username AWS --password-stdin \
  $(terraform output -raw ecr_frontend_url | cut -d'/' -f1)

# Build và push placeholder (nếu chưa có app thực)
docker pull nginx:alpine
docker tag nginx:alpine $(terraform output -raw ecr_frontend_url):latest
docker push $(terraform output -raw ecr_frontend_url):latest
```

## Lệnh hay dùng

```bash
# Xem ECS tasks đang chạy ở AZ nào
aws ecs describe-tasks \
  --cluster globalmart-cluster \
  --tasks $(aws ecs list-tasks --cluster globalmart-cluster --query 'taskArns[]' --output text) \
  --query 'tasks[].{AZ:availabilityZone, Status:lastStatus, Service:group}'

# Test RDS Failover (drill)
aws rds reboot-db-instance \
  --db-instance-identifier globalmart-db \
  --force-failover

# Xem RDS Proxy status
aws rds describe-db-proxies --db-proxy-name globalmart-db-proxy

# Scale ECS Service
aws ecs update-service \
  --cluster globalmart-cluster \
  --service globalmart-frontend-service \
  --desired-count 4

# Force deploy mới (restart containers)
aws ecs update-service \
  --cluster globalmart-cluster \
  --service globalmart-backend-service \
  --force-new-deployment

# Check Pipeline status
aws codepipeline get-pipeline-state \
  --name globalmart-pipeline \
  --query 'stageStates[].{Stage:stageName, Status:latestExecution.status}'

# Destroy (NGUY HIỂM — xóa toàn bộ)
terraform destroy
```

## Chi phí ước tính (ap-southeast-1)

| Dịch vụ | Cấu hình | Chi phí/tháng |
|---|---|---|
| ECS Fargate | 4 tasks (2 FE + 2 BE) × 256CPU/512MB | ~$15 |
| RDS Multi-AZ | db.t3.micro, 20GB | ~$30 |
| RDS Proxy | db.t3.micro target | ~$15 |
| NAT Gateway | 2 × $0.045/h + data | ~$70 |
| ALB | 2 × $0.008/h | ~$12 |
| ECR | 2 repos, ~10 images | ~$2 |
| CloudWatch | Logs + Metrics + Dashboard | ~$5 |
| **Tổng** | | **~$150/tháng** |

> NAT Gateway là tốn kém nhất. Có thể dùng VPC Endpoints cho ECR/S3 để giảm NAT traffic.

## Lưu ý quan trọng

- **KHÔNG commit** `terraform.tfvars` và `*.tfstate` lên GitHub
- **RDS password** tự động generate và lưu trong Secrets Manager — không bao giờ hardcode
- **RDS Proxy** cần ~5-10 phút sau khi create để AVAILABLE
- **SNS subscription** cần confirm thủ công qua email
- Set `deletion_protection = true` trên RDS khi production thực sự
