import { model, Schema, models, Model, Types } from "mongoose";
import { FIVE_MINUTES } from "../utils/constants";

type OtpDocument = Document & {
    email: string;
    otp: string;
    created_at: Date;
}

const OtpSchema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    created_at: { type: Date, default: Date.now, expires: FIVE_MINUTES },
});

const Otp: Model<OtpDocument> = models.Otp || model("otp", OtpSchema);

export { Otp, OtpDocument };