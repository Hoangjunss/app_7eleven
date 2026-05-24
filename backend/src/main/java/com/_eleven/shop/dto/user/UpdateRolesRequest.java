package com._eleven.shop.dto.user;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRolesRequest {
    @NotEmpty(message = "Roles cannot be empty")
    private Set<String> roles;
}
