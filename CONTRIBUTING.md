# Contributing to Relief-Map

Thank you for your interest in contributing to Relief-Map. Decentralized emergency response relies heavily on open-source community support to ensure the system is secure, fault-tolerant, and globally accessible.

## 1. Code of Conduct
By participating in this project, you commit to maintaining a professional, respectful, and collaborative environment. This platform is designed to save lives; we demand exceptional structural testing and code integrity.

## 2. Setting Up Your Environment
Before contributing, ensure you have correctly provisioned your local environment. Please refer strictly to our [SETUP.md](./SETUP.md) document to verify all system dependencies and API variables are appropriately configured.

## 3. Contribution Workflow

1. **Fork the Repository:** Create your own branch stemming from `main`.
2. **Branch Naming Conventions:** Adopt structured syntax for your branches:
   - `feature/your-feature-name` (For newly proposed architectures)
   - `fix/issue-description` (For rectifying existing anomalies)
   - `docs/what-you-updated` (For documentation adjustments)
3. **Commit Messages:** We adhere to conventional commits. Every commit must be logically bound to a single conceptual modification.
4. **Push to your Fork:** Commit your changes and upload to your tracking branch.
5. **Open a Pull Request:** Submit a Pull Request (PR) explicitly denoting:
   - What the modification solves.
   - Any UI/UX changes (provide before/after snapshots).
   - How the systems were tested locally prior to submission.

## 4. Architectural Rules & Best Practices

### Frontend (React/TypeScript)
- Strict TypeScript typings must be utilized; bypass declarations (e.g., `any`) are prohibited unless parsing dynamic NoSQL structures where interfaces are polymorphic.
- No direct `.css` mutation. Adhere strictly to the defined Tailwind utility classes located inside the global Theme Engine (`index.css`).

### Backend (Django/Python)
- Core routing endpoints must be handled through Django REST Framework views.
- Security dictates no arbitrary execution logic should precede validation schemas.

Thank you for dedicating your time to enhancing civic emergency technology.
