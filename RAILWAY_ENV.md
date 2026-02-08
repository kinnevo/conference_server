# Railway Environment Variables Configuration

This document lists all environment variables that must be configured in Railway for the SparkBridge server deployment.

## Required Environment Variables

### Authentication & JWT
```
NODE_ENV=production
JWT_ACCESS_SECRET=<32+ character secure secret>
JWT_REFRESH_SECRET=<32+ character secure secret, different from access>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=30d
```

**Generate secure secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database
```
DATABASE_URL=<auto-set by Railway PostgreSQL service>
```
This is automatically provided by Railway when you add a PostgreSQL database to your project.

### CORS
```
CORS_ORIGIN=<your Railway client URL>
```
Example: `https://sparkbridge-client.railway.app`

For multiple origins (e.g., staging + production):
```
CORS_ORIGIN=https://sparkbridge-client.railway.app,https://sparkbridge-staging.railway.app
```

### Encryption
```
ENCRYPTION_KEY=<32 byte hex string>
```
Used for encrypting LLM provider API keys.

**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Configuration Notes

### Session Duration
The current configuration provides:
- **Access Token**: 30 minutes (increased from 15m for better UX)
- **Refresh Token**: 30 days (increased from 7d for longer sessions)

To adjust session length:
- For stricter security: `JWT_ACCESS_EXPIRES_IN=15m` and `JWT_REFRESH_EXPIRES_IN=7d`
- For maximum convenience: `JWT_ACCESS_EXPIRES_IN=1h` and `JWT_REFRESH_EXPIRES_IN=90d`

### Database Configuration
Railway automatically handles:
- `PORT` - Dynamically assigned by Railway
- `DATABASE_URL` - PostgreSQL connection string with SSL

The application is configured with connection pooling:
- Max connections: 20
- Connection timeout: 10s
- Statement timeout: 30s
- Idle timeout: 30s

### Health Checks
The server exposes `/health` endpoint for Railway health monitoring.

## Deployment Steps

1. **Add PostgreSQL Service** in Railway dashboard
2. **Set Environment Variables** in Project Settings > Variables
3. **Verify Configuration** in deployment logs:
   ```
   [AUTH] JWT Configuration: { accessExpiresIn: '30m', refreshExpiresIn: '30d', secretsConfigured: true }
   [DB] Database pool initialized: { ssl: true, host: '...', maxConnections: 20 }
   ```
4. **Test Token Refresh** by logging in and monitoring logs after 30 minutes

## Troubleshooting

### Short Session Timeout
- Check JWT_ACCESS_EXPIRES_IN is set to 30m (not default 15m)
- Check JWT_REFRESH_EXPIRES_IN is set to 30d (not default 7d)
- Monitor logs for token refresh failures

### Token Refresh Failures
Check logs for:
- `[AUTH] Token refresh failed` - Server-side verification issues
- `[API] Token refresh failed` - Client-side network/retry issues
- `[DB] Database pool error` - Connection problems

### Database Connection Issues
- Verify DATABASE_URL is set by Railway
- Check for `[DB] Database connected successfully` in logs
- Ensure PostgreSQL service is running in Railway dashboard

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET
3. **Rotate secrets** periodically (will invalidate all existing tokens)
4. **Use strong CORS_ORIGIN** - only allow your client domain(s)
5. **Monitor logs** for unauthorized access attempts

## Support

For issues with Railway deployment:
- Check Railway logs in dashboard
- Review server startup logs for configuration errors
- Verify all required environment variables are set
- Test locally with same configuration to isolate Railway-specific issues
