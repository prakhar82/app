package com.grocery.identity.controller;

import com.grocery.common.api.DomainException;
import com.grocery.identity.dto.AddressResponse;
import com.grocery.identity.dto.AddressUpsertRequest;
import com.grocery.identity.service.AddressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/addresses")
public class AddressController {
    private final AddressService addressService;

    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public List<AddressResponse> list(@RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return addressService.list(requireUser(userEmail));
    }

    @GetMapping("/{id}")
    public AddressResponse one(@PathVariable("id") Long id,
                               @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return addressService.getOne(requireUser(userEmail), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AddressResponse create(@Valid @RequestBody AddressUpsertRequest request,
                                  @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return addressService.create(requireUser(userEmail), request);
    }

    @PutMapping("/{id}")
    public AddressResponse update(@PathVariable("id") Long id,
                                  @Valid @RequestBody AddressUpsertRequest request,
                                  @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        return addressService.update(requireUser(userEmail), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable("id") Long id,
                       @RequestHeader(name = "X-User-Email", required = false) String userEmail) {
        addressService.delete(requireUser(userEmail), id);
    }

    private String requireUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            throw new DomainException("UNAUTHORIZED", "Missing authenticated user");
        }
        return userEmail;
    }
}
