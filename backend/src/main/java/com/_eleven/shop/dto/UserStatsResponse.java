package com._eleven.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private long totalUsers;
    private long newUsers;
    private long lockedUsers;
    private List<UserRegistrationChartResponse> chartData;
}
