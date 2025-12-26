module.exports = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-development-only',
    jwtExpiresIn: '24h',
    bcryptRounds: 16, // Aumentado para 16 rounds para maior segurança
    passwordMinLength: 16, // Aumentado para 16 caracteres
    // Padrão de senha mais rigoroso
    passwordPattern: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{16,}$/,
    // Adicionar descrição do padrão para mensagens de erro
    passwordRequirements: {
        minLength: 16,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecial: true,
        specialChars: '@$!%*?&#',
        minSpecialChars: 2 // Requer pelo menos 2 caracteres especiais
    }
};
