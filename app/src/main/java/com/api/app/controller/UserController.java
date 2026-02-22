package com.api.app.controller;

import com.api.app.entity.User;
import com.api.app.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserRepository repo;

    @PostMapping
    public User create(@RequestBody User user){
        return repo.save(user);
    }

    @GetMapping
    public List<User> getAll(){
        return repo.findAll();
    }
}