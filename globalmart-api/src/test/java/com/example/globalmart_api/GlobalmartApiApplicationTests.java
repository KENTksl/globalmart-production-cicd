package com.example.globalmart_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration," +
				"org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration," +
				"org.springframework.boot.autoconfigure.sql.init.DataSourceInitializationAutoConfiguration," +
				"org.springframework.ai.vectorstore.mongodb.autoconfigure.MongoDBAtlasVectorStoreAutoConfiguration"
})
class GlobalmartApiApplicationTests {

	@Test
	void contextLoads() {
	}

}
