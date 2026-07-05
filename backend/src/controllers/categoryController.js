import express from "express";
import categories from "../models/category.js";
import { admin, protect } from "../middleware/auth.js";

//CRUD operations for category by admin

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const existingCategory = await categories.findOne({ name });
    if (existingCategory) {
      return res
        .status(400)
        .json({ success: false, message: "Category already exists" });
    }

    const newCategory = await categories.create({ name });

    return res.status(201).json({
      success: true,
      category: newCategory,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//updating category by admin
export const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const categoryId = req.params.id;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Category name is required" });
    }

    const category = await categories.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }

    category.name = name;
    await category.save();

    return res.status(200).json({
      success: true,
      category,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

//deleting category by admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await categories.findByIdAndDelete(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({ success: true, message: "Category removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//get all categories
export const getCategories = async (req, res) => {
  try {
    const allCategories = await categories.find();
    return res.status(200).json({ success: true, categories: allCategories });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//get category by id
export const getCategoryById = async (req, res) => {
  try {
    const category = await categories.findById(req.params.id);
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    return res.status(200).json({ success: true, category });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
