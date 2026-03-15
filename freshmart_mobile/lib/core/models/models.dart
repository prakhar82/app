class AuthSession {
  AuthSession({
    required this.accessToken,
    required this.tokenType,
    required this.expiresInSeconds,
    required this.role,
    required this.email,
  });

  final String accessToken;
  final String tokenType;
  final int expiresInSeconds;
  final String role;
  final String email;

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        accessToken: json['accessToken'] as String,
        tokenType: json['tokenType'] as String? ?? 'Bearer',
        expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 1800,
        role: json['role'] as String? ?? 'USER',
        email: json['email'] as String,
      );

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'tokenType': tokenType,
        'expiresInSeconds': expiresInSeconds,
        'role': role,
        'email': email,
      };
}

class Product {
  Product({
    required this.id,
    required this.name,
    required this.sku,
    required this.category,
    required this.subcategory,
    required this.price,
    required this.unit,
    this.discountPercent,
    this.taxPercent,
    this.imageUrl,
    this.description,
    this.availableQty,
    this.averageRating,
    this.reviewCount,
  });

  final int id;
  final String name;
  final String sku;
  final String category;
  final String subcategory;
  final double price;
  final String unit;
  final double? discountPercent;
  final double? taxPercent;
  final String? imageUrl;
  final String? description;
  final int? availableQty;
  final double? averageRating;
  final int? reviewCount;

  Product copyWith({int? availableQty, double? averageRating, int? reviewCount}) => Product(
        id: id,
        name: name,
        sku: sku,
        category: category,
        subcategory: subcategory,
        price: price,
        unit: unit,
        discountPercent: discountPercent,
        taxPercent: taxPercent,
        imageUrl: imageUrl,
        description: description,
        availableQty: availableQty ?? this.availableQty,
        averageRating: averageRating ?? this.averageRating,
        reviewCount: reviewCount ?? this.reviewCount,
      );

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: (json['id'] as num).toInt(),
        name: json['name'] as String,
        sku: json['sku'] as String,
        category: json['category'] as String? ?? '',
        subcategory: json['subcategory'] as String? ?? '',
        price: (json['price'] as num).toDouble(),
        unit: json['unit'] as String? ?? '',
        discountPercent: (json['discountPercent'] as num?)?.toDouble(),
        taxPercent: (json['taxPercent'] as num?)?.toDouble(),
        imageUrl: json['imageUrl'] as String?,
        description: json['description'] as String?,
        availableQty: (json['availableQty'] as num?)?.toInt(),
        averageRating: (json['averageRating'] as num?)?.toDouble(),
        reviewCount: (json['reviewCount'] as num?)?.toInt(),
      );
}

class ProductReview {
  ProductReview({
    required this.id,
    required this.userDisplayName,
    required this.rating,
    required this.createdAt,
    required this.updatedAt,
    this.comment,
  });

  final int id;
  final String userDisplayName;
  final double rating;
  final String? comment;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory ProductReview.fromJson(Map<String, dynamic> json) => ProductReview(
        id: (json['id'] as num).toInt(),
        userDisplayName: json['userDisplayName'] as String? ?? 'User',
        rating: (json['rating'] as num).toDouble(),
        comment: json['comment'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}

class CartItem {
  CartItem({
    required this.id,
    required this.userEmail,
    required this.sku,
    required this.itemName,
    required this.quantity,
  });

  final int id;
  final String userEmail;
  final String sku;
  final String itemName;
  final int quantity;

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: (json['id'] as num).toInt(),
        userEmail: json['userEmail'] as String,
        sku: json['sku'] as String,
        itemName: json['itemName'] as String,
        quantity: (json['quantity'] as num).toInt(),
      );
}

class Address {
  Address({
    this.id,
    this.label,
    required this.line1,
    this.line2,
    required this.city,
    required this.postcode,
    required this.country,
    this.isDefault = false,
  });

  final int? id;
  final String? label;
  final String line1;
  final String? line2;
  final String city;
  final String postcode;
  final String country;
  final bool isDefault;

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        id: (json['id'] as num?)?.toInt(),
        label: json['label'] as String?,
        line1: json['line1'] as String,
        line2: json['line2'] as String?,
        city: json['city'] as String,
        postcode: json['postcode'] as String,
        country: json['country'] as String,
        isDefault: json['isDefault'] as bool? ?? false,
      );

  Map<String, dynamic> toJson() => {
        'label': label,
        'line1': line1,
        'line2': line2,
        'city': city,
        'postcode': postcode,
        'country': country,
        'isDefault': isDefault,
      };
}

class UserProfile {
  UserProfile({
    required this.email,
    required this.role,
    required this.status,
    this.name,
    this.phone,
    this.preferredLanguage,
    this.defaultAddressId,
  });

  final String email;
  final String role;
  final String status;
  final String? name;
  final String? phone;
  final String? preferredLanguage;
  final int? defaultAddressId;

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        email: json['email'] as String,
        role: json['role'] as String? ?? 'USER',
        status: json['status'] as String? ?? 'ACTIVE',
        name: json['name'] as String?,
        phone: json['phone'] as String?,
        preferredLanguage: json['preferredLanguage'] as String?,
        defaultAddressId: (json['defaultAddressId'] as num?)?.toInt(),
      );
}

class OrderItem {
  OrderItem({
    required this.sku,
    required this.itemName,
    required this.quantity,
    required this.unitPrice,
  });

  final String sku;
  final String itemName;
  final int quantity;
  final double unitPrice;

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        sku: json['sku'] as String,
        itemName: json['itemName'] as String,
        quantity: (json['quantity'] as num).toInt(),
        unitPrice: (json['unitPrice'] as num).toDouble(),
      );
}

class OrderModel {
  OrderModel({
    required this.orderRef,
    required this.userEmail,
    required this.paymentMethod,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    required this.items,
    this.id,
    this.userPhone,
    this.rejectionComment,
  });

  final int? id;
  final String orderRef;
  final String userEmail;
  final String? userPhone;
  final String paymentMethod;
  final String status;
  final String? rejectionComment;
  final double totalAmount;
  final DateTime createdAt;
  final List<OrderItem> items;

  factory OrderModel.fromJson(Map<String, dynamic> json) => OrderModel(
        id: (json['id'] as num?)?.toInt(),
        orderRef: json['orderRef'] as String,
        userEmail: json['userEmail'] as String,
        userPhone: json['userPhone'] as String?,
        paymentMethod: json['paymentMethod'] as String,
        status: json['status'] as String,
        rejectionComment: json['rejectionComment'] as String?,
        totalAmount: (json['totalAmount'] as num).toDouble(),
        createdAt: DateTime.parse(json['createdAt'] as String),
        items: ((json['items'] as List?) ?? const []).map((e) => OrderItem.fromJson(e as Map<String, dynamic>)).toList(),
      );
}

class CheckoutResponse {
  CheckoutResponse({
    required this.orderRef,
    required this.status,
    required this.paymentStatus,
    this.redirectUrl,
  });

  final String orderRef;
  final String status;
  final String paymentStatus;
  final String? redirectUrl;

  factory CheckoutResponse.fromJson(Map<String, dynamic> json) => CheckoutResponse(
        orderRef: json['orderRef'] as String,
        status: json['status'] as String,
        paymentStatus: json['paymentStatus'] as String,
        redirectUrl: json['redirectUrl'] as String?,
      );
}

class InventoryItem {
  InventoryItem({
    required this.id,
    required this.sku,
    required this.productName,
    required this.totalQty,
    required this.reservedQty,
    required this.availableQty,
    required this.reorderThreshold,
  });

  final int id;
  final String sku;
  final String productName;
  final int totalQty;
  final int reservedQty;
  final int availableQty;
  final int reorderThreshold;

  factory InventoryItem.fromJson(Map<String, dynamic> json) => InventoryItem(
        id: (json['id'] as num).toInt(),
        sku: json['sku'] as String,
        productName: json['productName'] as String,
        totalQty: (json['totalQty'] as num).toInt(),
        reservedQty: (json['reservedQty'] as num).toInt(),
        availableQty: (json['availableQty'] as num).toInt(),
        reorderThreshold: (json['reorderThreshold'] as num).toInt(),
      );
}

class AdminUser {
  AdminUser({
    required this.id,
    required this.email,
    required this.role,
    required this.status,
    required this.googleVerified,
    required this.createdAt,
    this.name,
    this.phone,
  });

  final int id;
  final String email;
  final String? name;
  final String? phone;
  final String role;
  final String status;
  final bool googleVerified;
  final DateTime createdAt;

  factory AdminUser.fromJson(Map<String, dynamic> json) => AdminUser(
        id: (json['id'] as num).toInt(),
        email: json['email'] as String,
        name: json['name'] as String?,
        phone: json['phone'] as String?,
        role: json['role'] as String,
        status: json['status'] as String,
        googleVerified: json['googleVerified'] as bool? ?? false,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class AdminSummary {
  AdminSummary({
    required this.itemsSold,
    required this.revenue,
    required this.ordersInProcess,
  });

  final int itemsSold;
  final double revenue;
  final int ordersInProcess;

  factory AdminSummary.fromJson(Map<String, dynamic> json) => AdminSummary(
        itemsSold: (json['itemsSold'] as num?)?.toInt() ?? 0,
        revenue: (json['revenue'] as num?)?.toDouble() ?? 0,
        ordersInProcess: (json['ordersInProcess'] as num?)?.toInt() ?? 0,
      );
}
