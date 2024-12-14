import { model, Schema, models, Model } from "mongoose";

type UserDocument = Document & {
    email: string;
    username: string;
    verified: boolean;
    loginAttempts: number;
    password: string;
    deleted_at: Date;
}

const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    verified: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    verified_at: { type: Date, default: null },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
});

userSchema.index({ created_at: 1 }, { expireAfterSeconds: 3600 });

userSchema.pre("save", function (next) {
    if(this.verified && !this.verified_at) {
        this.verified_at = new Date();
    }
    next();
});

const User: Model<UserDocument> = models.User || model("User", userSchema);

export { User, UserDocument };