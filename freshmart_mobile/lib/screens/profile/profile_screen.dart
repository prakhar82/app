import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/models/models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/profile_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _languageController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final provider = context.read<ProfileProvider>();
      await provider.load();
      if (!mounted || provider.profile == null) {
        return;
      }
      _nameController.text = provider.profile?.name ?? '';
      _phoneController.text = provider.profile?.phone ?? '';
      _languageController.text = provider.profile?.preferredLanguage ?? '';
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _languageController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    try {
      await context.read<ProfileProvider>().saveProfile(
            name: _nameController.text.trim(),
            phone: _phoneController.text.trim(),
            preferredLanguage: _languageController.text.trim(),
          );
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Profile update failed: $error')));
    }
  }

  Future<void> _editAddress([Address? address]) async {
    final labelController = TextEditingController(text: address?.label ?? '');
    final line1Controller = TextEditingController(text: address?.line1 ?? '');
    final line2Controller = TextEditingController(text: address?.line2 ?? '');
    final cityController = TextEditingController(text: address?.city ?? '');
    final postcodeController = TextEditingController(text: address?.postcode ?? '');
    final countryController = TextEditingController(text: address?.country ?? 'NL');

    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(address == null ? 'Add address' : 'Edit address'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: labelController, decoration: const InputDecoration(labelText: 'Label')),
              TextField(controller: line1Controller, decoration: const InputDecoration(labelText: 'Line 1')),
              TextField(controller: line2Controller, decoration: const InputDecoration(labelText: 'Line 2')),
              TextField(controller: cityController, decoration: const InputDecoration(labelText: 'City')),
              TextField(controller: postcodeController, decoration: const InputDecoration(labelText: 'Postcode')),
              TextField(controller: countryController, decoration: const InputDecoration(labelText: 'Country')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, true), child: const Text('Save')),
        ],
      ),
    );

    if (saved == true) {
      try {
        await context.read<ProfileProvider>().saveAddress(
              Address(
                id: address?.id,
                label: labelController.text.trim(),
                line1: line1Controller.text.trim(),
                line2: line2Controller.text.trim(),
                city: cityController.text.trim(),
                postcode: postcodeController.text.trim(),
                country: countryController.text.trim(),
                isDefault: address?.isDefault ?? false,
              ),
            );
      } catch (error) {
        if (!mounted) {
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Address save failed: $error')));
      }
    }
  }

  Future<void> _changePassword() async {
    try {
      await context.read<ProfileProvider>().changePassword(
            currentPassword: _currentPasswordController.text,
            newPassword: _newPasswordController.text,
          );
      if (!mounted) {
        return;
      }
      _currentPasswordController.clear();
      _newPasswordController.clear();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Password updated')));
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Password change failed: $error')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<ProfileProvider, AuthProvider>(
      builder: (context, profile, auth, _) {
        return Scaffold(
          appBar: AppBar(
            title: const Text('Profile'),
            actions: [
              IconButton(
                onPressed: () => auth.logout(),
                icon: const Icon(Icons.logout),
              ),
            ],
          ),
          body: profile.loading
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Name')),
                            const SizedBox(height: 12),
                            TextField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Phone')),
                            const SizedBox(height: 12),
                            TextField(controller: _languageController, decoration: const InputDecoration(labelText: 'Preferred language')),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _saveProfile, child: const Text('Save profile')),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Addresses', style: Theme.of(context).textTheme.titleLarge),
                        FilledButton.tonal(onPressed: () => _editAddress(), child: const Text('Add')),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...profile.addresses.map(
                      (address) => Card(
                        child: ListTile(
                          title: Text(address.label ?? address.line1),
                          subtitle: Text('${address.line1}, ${address.city}, ${address.postcode}, ${address.country}'),
                          trailing: PopupMenuButton<String>(
                            onSelected: (value) async {
                              if (value == 'edit') {
                                await _editAddress(address);
                              } else if (value == 'delete' && address.id != null) {
                                await profile.deleteAddress(address.id!);
                              } else if (value == 'default' && address.id != null) {
                                await profile.setDefault(address.id!);
                              }
                            },
                            itemBuilder: (_) => [
                              const PopupMenuItem(value: 'edit', child: Text('Edit')),
                              const PopupMenuItem(value: 'default', child: Text('Set default')),
                              const PopupMenuItem(value: 'delete', child: Text('Delete')),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextField(
                              controller: _currentPasswordController,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'Current password'),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _newPasswordController,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'New password'),
                            ),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _changePassword, child: const Text('Change password')),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }
}
