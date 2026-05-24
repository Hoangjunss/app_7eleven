package com._eleven.shop.service;

import com._eleven.shop.dto.UpdateRolesRequest;
import com._eleven.shop.entity.User;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private UserService userService;

    @BeforeEach
    void setUp() {
        Authentication authentication = Mockito.mock(Authentication.class);
        when(authentication.getName()).thenReturn("admin@test.com");

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void testLockSelfThrowsException() {
        User self = User.builder()
                .id(1L)
                .email("admin@test.com")
                .build();

        when(userRepository.findByIdWithDeleted(1L)).thenReturn(Optional.of(self));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.lockUser(1L);
        });

        assertEquals("Bạn không thể tự khóa tài khoản của chính mình!", exception.getMessage());
    }

    @Test
    void testLockOtherUserSuccess() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));
        when(userRepository.save(any(User.class))).thenReturn(other);

        userService.lockUser(2L);

        assertTrue(other.isLocked());
        verify(userRepository).save(other);
    }

    @Test
    void testDemoteSelfThrowsException() {
        User self = User.builder()
                .id(1L)
                .email("admin@test.com")
                .build();

        when(userRepository.findByIdWithDeleted(1L)).thenReturn(Optional.of(self));

        UpdateRolesRequest request = UpdateRolesRequest.builder()
                .roles(Set.of("USER"))
                .build();

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.updateRoles(1L, request);
        });

        assertEquals("Bạn không thể tự gỡ quyền ADMIN của chính mình!", exception.getMessage());
    }
}
