const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
        },
        number: {
            type: String,
            required: true,
        },
        birthday: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    if (!value) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const birthday = new Date(value);
                    birthday.setHours(0, 0, 0, 0);
                    return birthday < today;
                },
                message: "birthday must be a real date"
            }
        },
        address: {
            type: String,
            required: true,
        },
        image: {
            type: String,
        },
        imagePublicId: {
            type: String,
            default: null,
        },
        roleId: {
            type: String,
            ref: "Role",
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['active', 'inactive', 'pending'],
            default: 'pending'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);