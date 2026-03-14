package com.grocery.identity.controller;

import com.grocery.identity.dto.AdminCreateUserRequest;
import com.grocery.identity.dto.AdminUpdateUserRequest;
import com.grocery.identity.dto.AdminUserResponse;
import com.grocery.identity.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
public class AdminUserController {
    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public List<AdminUserResponse> listUsers() {
        return adminUserService.listUsers();
    }

    @PostMapping
    public AdminUserResponse createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return adminUserService.createUser(request);
    }

    @PatchMapping("/{id}")
    public AdminUserResponse updateUser(@PathVariable("id") Long id,
                                        @RequestBody AdminUpdateUserRequest request,
                                        @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return adminUserService.updateUser(id, request, userEmail);
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable("id") Long id,
                           @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        adminUserService.deleteUser(id, userEmail);
    }
}
