package com.grocery.inventory.controller;

import com.grocery.inventory.dto.CartReservationRequest;
import com.grocery.inventory.dto.InventoryAdjustmentRequest;
import com.grocery.inventory.dto.InventoryUpsertRequest;
import com.grocery.inventory.dto.ReserveRequest;
import com.grocery.inventory.repo.InventoryRepository;
import com.grocery.inventory.service.InventoryReservationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
    private final InventoryReservationService inventoryReservationService;
    private final InventoryRepository inventoryRepository;

    public InventoryController(InventoryReservationService inventoryReservationService, InventoryRepository inventoryRepository) {
        this.inventoryReservationService = inventoryReservationService;
        this.inventoryRepository = inventoryRepository;
    }

    @PostMapping("/reserve")
    public String reserve(@Valid @RequestBody ReserveRequest request,
                          @RequestParam(name = "holdMinutes", defaultValue = "15") int holdMinutes) {
        return inventoryReservationService.reserve(request, holdMinutes);
    }

    @PostMapping("/commit/{orderRef}")
    public void commit(@PathVariable("orderRef") String orderRef) {
        inventoryReservationService.commit(orderRef);
    }

    @PostMapping("/release/{orderRef}")
    public void release(@PathVariable("orderRef") String orderRef) {
        inventoryReservationService.release(orderRef);
    }

    @GetMapping("/items")
    public Object list() {
        return inventoryRepository.findAll();
    }

    @GetMapping("/availability")
    public Map<String, Integer> availability(@RequestParam("sku") List<String> skus) {
        return inventoryReservationService.availability(skus);
    }

    @PostMapping("/cart/reserve")
    public void reserveForCart(@Valid @RequestBody CartReservationRequest request) {
        inventoryReservationService.reserveForCart(request);
    }

    @PostMapping("/cart/release")
    public void releaseForCart(@Valid @RequestBody CartReservationRequest request) {
        inventoryReservationService.releaseForCart(request);
    }

    @GetMapping("/admin/low-stock")
    public Object lowStock() {
        return inventoryReservationService.lowStock();
    }

    @PostMapping("/admin/adjust")
    public Object adjust(@Valid @RequestBody InventoryAdjustmentRequest request) {
        return inventoryReservationService.adjustInventory(request);
    }

    @PostMapping("/admin/upsert")
    public Object upsert(@Valid @RequestBody InventoryUpsertRequest request) {
        return inventoryReservationService.upsertInventory(request);
    }
}
