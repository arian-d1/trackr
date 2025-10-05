import mongoose from 'mongoose';

const capturedSchema = new mongoose.Schema({
	id: Number,
	user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	animal: String,
	photo: String,
	longitude: Number,
	latitude: Number
});

const Captured = mongoose.model('Captured', capturedSchema);

export default Captured;
