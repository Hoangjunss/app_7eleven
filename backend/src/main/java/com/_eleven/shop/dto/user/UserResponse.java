package com._eleven.shop.dto.user;

import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private List<String> roles;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private boolean deleted;
    private boolean locked;
}
