module.exports = function checkRequiredEnv() {
	const required = [
		'VNP_TMN_CODE',
		'VNP_HASH_SECRET',
		'VNP_PAYMENT_URL',
		'VNP_RETURN_URL'
	];
	const missing = required.filter(k => !process.env[k]);
	if (missing.length) {
		console.warn(`[ENV WARNING] Missing required VNPay envs: ${missing.join(', ')}`);
	}
};
