package com._eleven.shop.entity;

public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPING,
    DELIVERED,
    CANCELLED;

    public boolean isValidTransitionTo(OrderStatus target) {
        if (this == target) {
            return true;
        }
        switch (this) {
            case PENDING:
                return target == CONFIRMED || target == CANCELLED;
            case CONFIRMED:
                return target == SHIPPING || target == CANCELLED;
            case SHIPPING:
                return target == DELIVERED;
            case DELIVERED:
            case CANCELLED:
            default:
                return false;
        }
    }
}
