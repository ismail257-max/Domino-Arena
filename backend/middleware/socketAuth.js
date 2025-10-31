const jwt = require('jsonwebtoken');

/**
 * Socket.io middleware for JWT authentication.
 * Verifies the token provided in the socket's handshake auth object.
 * Attaches the decoded user ID to the socket object for use in event handlers.
 */
const socketAuth = (socket, next) => {
    // The token is expected to be sent in the `auth` object during connection
    const token = socket.handshake.auth?.token;

    if (!token) {
        // If no token is provided, reject the connection
        return next(new Error('Authentication error: No token provided.'));
    }

    try {
        // Verify the token using the same secret as the REST API
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the user's ID from the token payload to the socket instance
        socket.user = { id: decoded.id };

        // Proceed to the connection
        next();
    } catch (error) {
        // If token verification fails, reject the connection
        console.error('Socket authentication failed:', error.message);
        return next(new Error('Authentication error: Invalid token.'));
    }
};

module.exports = socketAuth;
