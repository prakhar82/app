import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_windows/webview_windows.dart';

import '../../providers/order_provider.dart';

class PaymentWebViewArgs {
  PaymentWebViewArgs({
    required this.orderRef,
    required this.redirectUrl,
  });

  final String orderRef;
  final String redirectUrl;
}

class PaymentWebViewScreen extends StatefulWidget {
  const PaymentWebViewScreen({super.key, required this.arguments});

  static const routeName = '/payment';

  final PaymentWebViewArgs arguments;

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  WebviewController? _windowsController;
  late final WebViewController _mobileController;

  @override
  void initState() {
    super.initState();
    if (Platform.isWindows) {
      _initWindowsController();
    } else {
      _mobileController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onNavigationRequest: (request) {
              _handleNavigation(request.url);
              return NavigationDecision.navigate;
            },
          ),
        )
        ..loadRequest(Uri.parse(widget.arguments.redirectUrl));
    }
  }

  Future<void> _initWindowsController() async {
    final controller = WebviewController();
    await controller.initialize();
    await controller.setPopupWindowPolicy(WebviewPopupWindowPolicy.deny);
    await controller.setBackgroundColor(Colors.white);
    await controller.loadUrl(widget.arguments.redirectUrl);
    controller.url.listen(_handleNavigation);
    if (mounted) {
      setState(() => _windowsController = controller);
    }
  }

  Future<void> _handleNavigation(String url) async {
    if (!url.contains('/app/checkout')) {
      return;
    }
    final uri = Uri.parse(url);
    final result = uri.queryParameters['result'];
    final sessionId = uri.queryParameters['sessionId'];

    try {
      if (result == 'success' && sessionId != null) {
        await context.read<OrderProvider>().confirmPayment(widget.arguments.orderRef, sessionId);
        await context.read<OrderProvider>().loadOrders();
        if (mounted) {
          Navigator.pop(context, true);
        }
      } else if (result == 'cancel') {
        await context.read<OrderProvider>().cancelPayment(widget.arguments.orderRef);
        await context.read<OrderProvider>().loadOrders();
        if (mounted) {
          Navigator.pop(context, false);
        }
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment handling failed: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWindows = !kIsWeb && Platform.isWindows;
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: isWindows
          ? (_windowsController == null
              ? const Center(child: CircularProgressIndicator())
              : Webview(_windowsController!))
          : WebViewWidget(controller: _mobileController),
    );
  }
}
