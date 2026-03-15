import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'app.dart';
import 'core/services/api_client.dart';
import 'core/services/auth_api_service.dart';
import 'core/services/biometric_service.dart';
import 'core/services/catalog_api_service.dart';
import 'core/services/cart_api_service.dart';
import 'core/services/order_api_service.dart';
import 'core/services/profile_api_service.dart';
import 'core/services/secure_storage_service.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/order_provider.dart';
import 'providers/profile_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final storage = SecureStorageService();
  final apiClient = ApiClient(storage);

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: storage),
        Provider.value(value: apiClient),
        Provider(create: (_) => BiometricService()),
        Provider(create: (context) => AuthApiService(context.read<ApiClient>())),
        Provider(create: (context) => CatalogApiService(context.read<ApiClient>())),
        Provider(create: (context) => CartApiService(context.read<ApiClient>())),
        Provider(create: (context) => OrderApiService(context.read<ApiClient>())),
        Provider(create: (context) => ProfileApiService(context.read<ApiClient>())),
        ChangeNotifierProvider(
          create: (context) => AuthProvider(
            authApi: context.read<AuthApiService>(),
            storage: context.read<SecureStorageService>(),
            biometricService: context.read<BiometricService>(),
          )..bootstrap(),
        ),
        ChangeNotifierProvider(create: (context) => CatalogProvider(context.read<CatalogApiService>())),
        ChangeNotifierProvider(create: (context) => CartProvider(context.read<CartApiService>(), context.read<AuthProvider>())),
        ChangeNotifierProvider(create: (context) => OrderProvider(context.read<OrderApiService>(), context.read<AuthProvider>())),
        ChangeNotifierProvider(create: (context) => ProfileProvider(context.read<ProfileApiService>(), context.read<AuthProvider>())),
      ],
      child: const FreshMartApp(),
    ),
  );
}
