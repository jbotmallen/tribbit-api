import { model, Model, models, Schema } from "mongoose";
import { ONE_HOUR } from "../utils/constants";

type TokenDocument = Document & {
    user_id: string;
    token: string;
    valid: Date;
    created_at: Date;
}

const tokenSchema = new Schema({
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    valid: { type: Date, default: Date.now() + ONE_HOUR },
    created_at: { type: Date, default: Date.now },
});

const Token: Model<TokenDocument> = models.Token || model("Token", tokenSchema);

export { Token, TokenDocument };