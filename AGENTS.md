# Repository Guidelines

## Project Structure & Module Organization
Doable is a worker-booking application with separate JavaScript packages:
- `client/src/`: React screens, authentication forms, customer/worker dashboards, booking components, and CSS. `App.js` defines routes; `index.js` mounts the application.
- `client/public/`: static HTML, icons, and manifest assets.
- `server/server.js`: Express middleware, Mongoose models, API routes, and upload handling.
- `server/uploads/`: stored user images served through `/uploads`.
- `server/migrate_bookings.js`: database migration utility; also duplicated in `client/src/`.
- `client/src/App.test.js` and `setupTests.js`: current frontend test setup. No backend test suite exists.

## Build, Test, and Development Commands
From the repository root:
- `npm ci --prefix client` and `npm ci --prefix server`: install each package using its lockfile.
- `npm start --prefix client`: start the React development server on port 3000.
- `cd server && node server.js`: start the API on port 3001 by default; requires `MONGO_URI` in `server/.env`.
- `npm run build --prefix client`: create the production bundle in `client/build/`.
- `npm test --prefix client`: run frontend tests in watch mode.
- `CI=true npm test --prefix client -- --watchAll=false`: run tests once.

## Coding Style & Naming Conventions
Use two-space indentation, semicolons, and the surrounding file's quote style. Frontend files use ES module imports and React function components; backend files use CommonJS. Name components and their files in PascalCase, such as `WorkerDashboard.js`; use camelCase for functions and variables. Preserve `.js`/`.jsx` conventions. ESLint uses `react-app` and `react-app/jest` through Create React App; no separate lint script or formatter is configured.

## Testing Guidelines
Use Jest and React Testing Library; name tests `*.test.js` alongside source files. Wrap routed components in an appropriate router and mock API requests. The existing `App.test.js` still asserts the starter “learn react” text and needs updating for current routes. No coverage threshold exists. Backend `npm test` is a failing placeholder; document manual API checks for backend changes.

## Commit & Pull Request Guidelines
History uses imperative subjects like `Update Login.js`; no prefix convention is enforced. Describe the changed behavior in commits. PRs should explain purpose, affected flows, validation results, and related issues. Include UI screenshots and relevant configuration or migration notes.

## Security & Configuration
Keep credentials in ignored `.env` files. Client API URLs currently target a deployed Render service; point relevant URLs to the local API before testing writes. Use a development database and back it up before running booking migrations. Avoid committing new personal uploads or secrets.
