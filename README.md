# Aniverse

Aniverse is a modern web application suite built with Angular and managed as an Nx Monorepo. It includes two Angular applications: `angular-forum` (a forum system) and `anime-db` (a database interface), as well as a NestJS backend service `base`. The project leverages Nx for efficient workspace management, Tailwind CSS for utility-first styling, and PrimeNG for rich UI components.

## 🚀 Features

- Fast, responsive user interfaces for both `angular-forum` and `anime-db`
- Modular architecture with Angular standalone components
- Utility-first styling with Tailwind CSS
- Rich UI components powered by PrimeNG
- Efficient code scaffolding, testing, and building with Nx
- Ready for production deployment on Render.com

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v8 or higher recommended)
- [Nx CLI](https://nx.dev/getting-started/installation) (install globally: `pnpm add -g nx`)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/aniverse.git
cd aniverse-monorepo
pnpm install
```

### Development Server

Start the local development server for each project:

- For `angular-forum`:
  ```bash
  nx serve angular-forum
  ```
  Navigate to [http://localhost:4201/](http://localhost:4201/) in your browser.

- For `anime-db`:
  ```bash
  nx serve anime-db
  ```
  Navigate to [http://localhost:4202/](http://localhost:4202/) in your browser.

- For the `base` backend (NestJS):
  ```bash
  nx serve base
  ```
  The API is available at [http://localhost:3000/api](http://localhost:3000/api).

Both apps reload automatically on code changes. To run both projects simultaneously:
```bash
nx run-many --targets=serve --projects=angular-forum,anime-db
```

## 🎨 Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for utility-first styling. Customize styles in the `tailwind.config.js` file located in the root or project-specific directories.

## 🌟 UI Components

[PrimeNG](https://primeng.org/) is used for feature-rich UI components. Refer to the PrimeNG documentation for usage and customization.

## 🧩 Code Scaffolding

Generate new components, services, or libraries using Nx CLI:

- For `angular-forum`:
  ```bash
  nx generate @nx/angular:component component-name --project=angular-forum
  ```

- For `anime-db`:
  ```bash
  nx generate @nx/angular:component component-name --project=anime-db
  ```

- To create a shared library:
  ```bash
  nx generate @nx/angular:library shared --directory=projects/frontend/libs/shared
  ```

For more options, run:
```bash
nx generate --help
```

## 🏗️ Building for Production

Build the projects for production:

- For `angular-forum`:
  ```bash
  nx build angular-forum --prod
  ```
  Artifacts are stored in `dist/projects/frontend/angular-forum`.

- For `anime-db`:
  ```bash
  nx build anime-db --prod
  ```
  Artifacts are stored in `dist/projects/frontend/anime-db`.

To build both projects:
```bash
nx run-many --targets=build --projects=angular-forum,anime-db --prod
```

## 🧪 Running Tests

### Unit Tests

Run unit tests with Jest:

- For `angular-forum`:
  ```bash
  nx test angular-forum
  ```

- For `anime-db`:
  ```bash
  nx test anime-db
  ```

### End-to-End Tests

Run e2e tests with Cypress:

- For `angular-forum`:
  ```bash
  nx e2e angular-forum-e2e
  ```

- For `anime-db`:
  ```bash
  nx e2e anime-db-e2e
  ```

## 🌐 Deployment

The projects are deployed on [Render.com](https://render.com/) with automatic deployment on each push to the repository.

- **angular-forum**:
  - Build Command: `nx build angular-forum --prod`
  - Publish Directory: `dist/projects/frontend/angular-forum`

- **anime-db** (if deployed separately):
  - Build Command: `nx build anime-db --prod`
  - Publish Directory: `dist/projects/frontend/anime-db`

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## 📚 Resources

- [Nx Documentation](https://nx.dev/)
- [Angular Documentation](https://angular.dev/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PrimeNG Documentation](https://primeng.org/)

---

Made with ❤️ using Angular, Nx, Tailwind CSS, and PrimeNG.
