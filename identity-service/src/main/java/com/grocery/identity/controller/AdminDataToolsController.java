package com.grocery.identity.controller;

import com.grocery.identity.service.AdminDataToolsService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/admin/tools")
public class AdminDataToolsController {
    private final AdminDataToolsService adminDataToolsService;

    public AdminDataToolsController(AdminDataToolsService adminDataToolsService) {
        this.adminDataToolsService = adminDataToolsService;
    }

    @GetMapping("/backup")
    public ResponseEntity<byte[]> downloadBackup() {
        return toResponse(adminDataToolsService.generateBackupZip());
    }

    @PostMapping("/restore")
    public void restoreBackup(@RequestParam("file") MultipartFile file) {
        adminDataToolsService.restoreBackup(file);
    }

    @PostMapping("/cleanup")
    public void cleanupAppData() {
        adminDataToolsService.cleanAppDataExceptAdmins();
    }

    @GetMapping("/reports/orders")
    public ResponseEntity<byte[]> orderReport(@RequestParam(name = "format", defaultValue = "pdf") String format) {
        return toResponse(adminDataToolsService.generateOrderReport(format));
    }

    @GetMapping("/reports/inventory")
    public ResponseEntity<byte[]> inventoryReport(@RequestParam(name = "format", defaultValue = "pdf") String format) {
        return toResponse(adminDataToolsService.generateInventoryReport(format));
    }

    private ResponseEntity<byte[]> toResponse(AdminDataToolsService.DownloadPayload payload) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(payload.fileName()).build().toString())
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .body(payload.content());
    }
}
