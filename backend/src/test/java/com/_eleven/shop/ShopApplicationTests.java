package com._eleven.shop;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import com._eleven.shop.service.CloudinaryStorageService;

@SpringBootTest
@ActiveProfiles("test")
class ShopApplicationTests {

	@MockBean
	private CloudinaryStorageService cloudinaryStorageService;

	@Test
	void contextLoads() {
	}

}


