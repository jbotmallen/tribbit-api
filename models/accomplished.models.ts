import { model, Schema, models, Model, Types } from "mongoose";

type AccomplishedDocument = Document & {
    habit_id: string;
    date_changed: Date;
    accomplished: boolean;
}

const accomplishedSchema = new Schema({
    habit_id: { type: Types.ObjectId, ref: "Habit", required: true },
    date_changed: { type: Date, default: Date.now },
    accomplished: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null },
});

const Accomplished: Model<AccomplishedDocument> = models.Accomplished || model("Accomplished", accomplishedSchema);

export { Accomplished, AccomplishedDocument };