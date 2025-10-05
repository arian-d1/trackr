import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
	id: Number,
	username: String,
});

const User = mongoose.model('User', userSchema);

export default User;
