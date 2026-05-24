package com._eleven.shop.service;

import com._eleven.shop.dto.UpdateRolesRequest;
import com._eleven.shop.dto.UserResponse;
import com._eleven.shop.entity.Role;
import com._eleven.shop.entity.User;
import com._eleven.shop.exception.ResourceNotFoundException;
import com._eleven.shop.repository.RoleRepository;
import com._eleven.shop.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
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
        Mockito.lenient().when(authentication.getName()).thenReturn("admin@test.com");

        SecurityContext securityContext = Mockito.mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
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

        assertEquals("You cannot lock your own account", exception.getMessage());
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

        assertEquals("You cannot demote your own ADMIN role", exception.getMessage());
    }

    @Test
    void testLockDeletedUserThrowsNotFound() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .deleted(true)
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.lockUser(2L);
        });
    }

    @Test
    void testRestoreUserSuccess() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .locked(true)
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));
        when(userRepository.save(any(User.class))).thenReturn(other);

        userService.restoreUser(2L);

        assertFalse(other.isLocked());
        verify(userRepository).save(other);
    }

    @Test
    void testRestoreDeletedUserThrowsNotFound() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .deleted(true)
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.restoreUser(2L);
        });
    }

    @Test
    void testDeleteSelfThrowsException() {
        User self = User.builder()
                .id(1L)
                .email("admin@test.com")
                .build();

        when(userRepository.findByIdWithDeleted(1L)).thenReturn(Optional.of(self));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            userService.deleteUser(1L);
        });

        assertEquals("You cannot delete your own account", exception.getMessage());
    }

    @Test
    void testDeleteOtherUserSuccess() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));

        userService.deleteUser(2L);

        verify(userRepository).delete(other);
    }

    @Test
    void testDeleteUserAlreadyDeletedThrowsNotFound() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .deleted(true)
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.deleteUser(2L);
        });
    }

    @Test
    void testDeleteLockedUserSuccess() {
        User other = User.builder()
                .id(2L)
                .email("other@test.com")
                .locked(true)
                .build();

        when(userRepository.findByIdWithDeleted(2L)).thenReturn(Optional.of(other));

        userService.deleteUser(2L);

        verify(userRepository).delete(other);
    }

    @Test
    void testUserNotFoundThrowsResourceNotFoundException() {
        when(userRepository.findByIdWithDeleted(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.lockUser(99L);
        });
    }

    @Test
    void testGetAllUsersFilterVerification() {
        Pageable expectedPageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "created_at"));
        when(userRepository.findAllUsersWithFilters("test", "active", expectedPageable))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        Page<UserResponse> result = userService.getAllUsers("test", "active", 0, 10, "desc");

        assertNotNull(result);
        verify(userRepository).findAllUsersWithFilters("test", "active", expectedPageable);
    }
}
