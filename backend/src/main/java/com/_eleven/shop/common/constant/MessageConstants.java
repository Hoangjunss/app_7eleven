package com._eleven.shop.common.constant;

public final class MessageConstants {
    private MessageConstants() {}

    // Category
    public static final String CATEGORY_NOT_FOUND = "Category not found";
    public static final String CATEGORY_NAME_EXISTS = "Category name already exists";
    public static final String CATEGORY_HAS_PRODUCTS = "Cannot delete category that has products. Please move or delete products first.";

    // Product
    public static final String PRODUCT_NOT_FOUND = "Product not found";
    public static final String PRODUCT_NAME_EXISTS = "Product name already exists";
    public static final String INSUFFICIENT_STOCK = "Insufficient stock for product: ";

    // User / Auth
    public static final String USER_NOT_FOUND = "User not found";
    public static final String EMAIL_TAKEN = "Email is already taken";
    public static final String WRONG_PASSWORD = "Incorrect password, please try again";
    public static final String ACCOUNT_LOCKED = "Account is locked. Please contact administrator.";
    public static final String LOGIN_FAILED = "Invalid email or password";
    public static final String CANNOT_LOCK_SELF = "You cannot lock your own account";
    public static final String CANNOT_DELETE_SELF = "You cannot delete your own account";
    public static final String CANNOT_DEMOTE_SELF = "You cannot demote your own ADMIN role";

    // Order
    public static final String ORDER_NOT_FOUND = "Order not found";
    public static final String CART_EMPTY = "Cart is empty, cannot create order";
    public static final String INVALID_STATUS_TRANSITION = "Invalid order status transition";
    public static final String ONLY_PENDING_CAN_CANCEL = "Only pending orders can be cancelled";

    // Common
    public static final String INTERNAL_SERVER_ERROR = "An internal error occurred. Please try again later.";
}
