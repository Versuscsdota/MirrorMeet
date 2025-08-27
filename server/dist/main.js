"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    app.enableCors({ origin: origins, credentials: true });
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
bootstrap();
//# sourceMappingURL=main.js.map