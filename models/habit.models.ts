import { model, Schema, models, Model, Types } from "mongoose";

type HabitDocument = Document & {
    name: string;
    goal: number;
    colorScheme: string;
    user_id: string;
}

const habitSchema = new Schema({
    name: { type: String, required: true },
    goal: { type: Number, required: true },
    user_id: { type: Types.ObjectId, ref: "User", required: true },
    colorScheme: { type: String, default: "#000000" },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
    color: {
        type: String,
        enum: ["#BFFF95", "#89E2CD", "#FBEF95", "#FEBCEA", "#F2C394"],
        default: "#BFFF95"
    },
});

const Habit: Model<HabitDocument> = models.Habit || model("Habit", habitSchema);

export { Habit, HabitDocument };