import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/services/admin_api_service.dart';
import '../../providers/admin_provider.dart';
import '../../providers/auth_provider.dart';

class AdminHomeScreen extends StatefulWidget {
  const AdminHomeScreen({super.key});

  @override
  State<AdminHomeScreen> createState() => _AdminHomeScreenState();
}

class _AdminHomeScreenState extends State<AdminHomeScreen> {
  int _index = 0;
  final _rejectionController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().loadDashboard();
    });
  }

  @override
  void dispose() {
    _rejectionController.dispose();
    super.dispose();
  }

  Future<void> _saveBytes(List<int> bytes, String suggestedName) async {
    final path = await FilePicker.platform.saveFile(fileName: suggestedName);
    if (path == null) {
      return;
    }
    final file = File(path);
    await file.writeAsBytes(bytes, flush: true);
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved $suggestedName')));
  }

  Future<void> _pickAndUploadInventory() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['xlsx', 'xls'], withData: true);
    if (result == null || result.files.isEmpty || result.files.single.bytes == null) {
      return;
    }
    try {
      await context.read<AdminApiService>().uploadInventory(result.files.single.bytes!, result.files.single.name);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Inventory upload completed')));
      await context.read<AdminProvider>().refreshInventory();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $error')));
    }
  }

  Future<void> _downloadBackup() async {
    try {
      final bytes = await context.read<AdminApiService>().downloadBackup();
      await _saveBytes(bytes, 'backup.zip');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Backup download failed: $error')));
    }
  }

  Future<void> _restoreBackup() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['zip'], withData: true);
    if (result == null || result.files.isEmpty || result.files.single.bytes == null) {
      return;
    }
    try {
      await context.read<AdminApiService>().restoreBackup(result.files.single.bytes!, result.files.single.name);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Backup restored')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Restore failed: $error')));
    }
  }

  Future<void> _downloadReport(String kind, String format) async {
    try {
      final bytes = await context.read<AdminApiService>().downloadReport(kind, format);
      await _saveBytes(bytes, '$kind.$format');
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Report download failed: $error')));
    }
  }

  Future<void> _cleanupSystem() async {
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Clean system'),
            content: const Text('Delete app data and keep only admin users? Download a backup first.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Clean')),
            ],
          ),
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    try {
      await context.read<AdminApiService>().cleanupSystem();
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('System cleaned')));
      await context.read<AdminProvider>().loadDashboard();
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cleanup failed: $error')));
    }
  }

  Future<void> _changeOrderStatus(String orderRef, String currentStatus) async {
    String status = currentStatus;
    _rejectionController.clear();
    final confirmed = await showDialog<bool>(
          context: context,
          builder: (context) => StatefulBuilder(
            builder: (context, setDialogState) => AlertDialog(
              title: Text('Update $orderRef'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: status,
                    items: const [
                      DropdownMenuItem(value: 'PAYMENT_PENDING', child: Text('Payment Pending')),
                      DropdownMenuItem(value: 'CONFIRMED', child: Text('Payment Confirmed')),
                      DropdownMenuItem(value: 'COD_PENDING', child: Text('Cash on Delivery')),
                      DropdownMenuItem(value: 'REJECTED', child: Text('Rejected')),
                    ],
                    onChanged: (value) => setDialogState(() => status = value ?? currentStatus),
                  ),
                  if (status == 'REJECTED') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _rejectionController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Rejection comment', border: OutlineInputBorder()),
                    ),
                  ],
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
              ],
            ),
          ),
        ) ??
        false;
    if (!confirmed) {
      return;
    }
    try {
      await context.read<AdminProvider>().updateOrderStatus(
            orderRef: orderRef,
            status: status,
            comment: status == 'REJECTED' ? _rejectionController.text.trim() : null,
          );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order update failed: $error')));
    }
  }

  Widget _buildOrders(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (admin.summary != null)
          Row(
            children: [
              Expanded(child: _StatCard(label: 'Items Sold', value: '${admin.summary!.itemsSold}')),
              const SizedBox(width: 12),
              Expanded(child: _StatCard(label: 'Revenue', value: 'EUR ${admin.summary!.revenue.toStringAsFixed(2)}')),
              const SizedBox(width: 12),
              Expanded(child: _StatCard(label: 'In Process', value: '${admin.summary!.ordersInProcess}')),
            ],
          ),
        const SizedBox(height: 16),
        const Text('Order Management', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        ...admin.orders.map(
          (order) => Card(
            child: ListTile(
              title: Text(order.orderRef),
              subtitle: Text('${order.status} - ${order.paymentMethod}\n${order.userEmail}'),
              isThreeLine: true,
              trailing: FilledButton.tonal(
                onPressed: () => _changeOrderStatus(order.orderRef, order.status),
                child: const Text('Manage'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInventory(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Inventory', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        ...admin.inventory.map(
          (item) => Card(
            child: ListTile(
              title: Text(item.productName),
              subtitle: Text('${item.sku} - Available ${item.availableQty} - Threshold ${item.reorderThreshold}'),
              trailing: FilledButton.tonal(
                onPressed: () async {
                  try {
                    await context.read<AdminProvider>().adjustInventory(
                          sku: item.sku,
                          quantityDelta: 1,
                          reason: 'Admin mobile adjustment',
                          reorderThreshold: item.reorderThreshold,
                        );
                  } catch (error) {
                    if (!mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Inventory update failed: $error')));
                  }
                },
                child: const Text('+1'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUsers(AdminProvider admin) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Users', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            FilledButton.tonal(
              onPressed: () async {
                final emailController = TextEditingController();
                final nameController = TextEditingController();
                final phoneController = TextEditingController();
                final passwordController = TextEditingController();
                String role = 'USER';
                final save = await showDialog<bool>(
                      context: context,
                      builder: (context) => StatefulBuilder(
                        builder: (context, setDialogState) => AlertDialog(
                          title: const Text('Add user'),
                          content: SingleChildScrollView(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                TextField(controller: emailController, decoration: const InputDecoration(labelText: 'Email')),
                                TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                                TextField(controller: phoneController, decoration: const InputDecoration(labelText: 'Phone')),
                                TextField(controller: passwordController, decoration: const InputDecoration(labelText: 'Password')),
                                DropdownButtonFormField<String>(
                                  value: role,
                                  items: const [
                                    DropdownMenuItem(value: 'USER', child: Text('USER')),
                                    DropdownMenuItem(value: 'ADMIN', child: Text('ADMIN')),
                                  ],
                                  onChanged: (value) => setDialogState(() => role = value ?? 'USER'),
                                ),
                              ],
                            ),
                          ),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                            FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Save')),
                          ],
                        ),
                      ),
                    ) ??
                    false;
                if (!save) {
                  return;
                }
                try {
                  await context.read<AdminProvider>().createUser(
                        email: emailController.text.trim(),
                        password: passwordController.text,
                        role: role,
                        name: nameController.text.trim(),
                        phone: phoneController.text.trim(),
                      );
                } catch (error) {
                  if (!mounted) {
                    return;
                  }
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Create user failed: $error')));
                }
              },
              child: const Text('Add User'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...admin.users.map(
          (user) => Card(
            child: ListTile(
              title: Text(user.email),
              subtitle: Text('${user.role} - ${user.status}\n${user.name ?? 'No name'} - ${user.phone ?? 'No phone'}'),
              isThreeLine: true,
              trailing: IconButton(
                onPressed: () async {
                  try {
                    await context.read<AdminProvider>().deleteUser(user.id);
                  } catch (error) {
                    if (!mounted) {
                      return;
                    }
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete user failed: $error')));
                  }
                },
                icon: const Icon(Icons.delete_outline),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMaintenance() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Maintenance', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Inventory Upload', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _pickAndUploadInventory, child: const Text('Upload Inventory Excel')),
                const SizedBox(height: 16),
                const Text('Backup and Restore', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _downloadBackup, child: const Text('Download backup.zip')),
                const SizedBox(height: 8),
                FilledButton.tonal(onPressed: _restoreBackup, child: const Text('Restore backup.zip')),
                const SizedBox(height: 16),
                const Text('Reports', style: TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    FilledButton.tonal(onPressed: () => _downloadReport('orders', 'pdf'), child: const Text('Orders PDF')),
                    FilledButton.tonal(onPressed: () => _downloadReport('orders', 'xlsx'), child: const Text('Orders Excel')),
                    FilledButton.tonal(onPressed: () => _downloadReport('inventory', 'pdf'), child: const Text('Inventory PDF')),
                    FilledButton.tonal(onPressed: () => _downloadReport('inventory', 'xlsx'), child: const Text('Inventory Excel')),
                  ],
                ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _cleanupSystem,
                  style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
                  child: const Text('Clean System'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AdminProvider, AuthProvider>(
      builder: (context, admin, auth, _) {
        final pages = [
          _buildOrders(admin),
          _buildInventory(admin),
          _buildUsers(admin),
          _buildMaintenance(),
        ];

        return Scaffold(
          appBar: AppBar(
            title: const Text('FreshMart Admin'),
            actions: [
              IconButton(
                onPressed: () => auth.logout(),
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: admin.loading ? const Center(child: CircularProgressIndicator()) : pages[_index],
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index,
            onDestinationSelected: (index) => setState(() => _index = index),
            destinations: const [
              NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Orders'),
              NavigationDestination(icon: Icon(Icons.inventory_2_outlined), selectedIcon: Icon(Icons.inventory_2), label: 'Inventory'),
              NavigationDestination(icon: Icon(Icons.group_outlined), selectedIcon: Icon(Icons.group), label: 'Users'),
              NavigationDestination(icon: Icon(Icons.build_outlined), selectedIcon: Icon(Icons.build), label: 'Maintenance'),
            ],
          ),
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      ),
    );
  }
}
