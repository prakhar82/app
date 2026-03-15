import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'screens/admin/admin_home_screen.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/orders/order_detail_screen.dart';
import 'screens/payment/payment_webview_screen.dart';
import 'screens/products/product_detail_screen.dart';
import 'screens/splash/splash_screen.dart';

class FreshMartApp extends StatelessWidget {
  const FreshMartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        return MaterialApp(
          title: 'FreshMart Mobile',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F766E)),
            useMaterial3: true,
            scaffoldBackgroundColor: const Color(0xFFF3F8F6),
          ),
          home: auth.isBootstrapping
              ? const SplashScreen()
              : auth.isAuthenticated
                  ? (auth.isAdmin ? const AdminHomeScreen() : const HomeScreen())
                  : const LoginScreen(),
          routes: {
            RegisterScreen.routeName: (_) => const RegisterScreen(),
            ForgotPasswordScreen.routeName: (_) => const ForgotPasswordScreen(),
          },
          onGenerateRoute: (settings) {
            if (settings.name == ProductDetailScreen.routeName) {
              return MaterialPageRoute(
                builder: (_) => ProductDetailScreen(productId: settings.arguments as int),
              );
            }
            if (settings.name == PaymentWebViewScreen.routeName) {
              return MaterialPageRoute(
                builder: (_) => PaymentWebViewScreen(arguments: settings.arguments as PaymentWebViewArgs),
              );
            }
            if (settings.name == OrderDetailScreen.routeName) {
              return MaterialPageRoute(
                builder: (_) => OrderDetailScreen(orderRef: settings.arguments as String),
              );
            }
            return null;
          },
        );
      },
    );
  }
}
