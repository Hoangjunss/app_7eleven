# Git Workflow for AI Assistant (App 7Eleven Project)

This document guides the AI (or any developer) on how to interact with Git for the **7Eleven MVP project**. The goal is to maintain a clean, professional, and traceable history, which is a good practice even for a solo developer.

## 1. Repository Information
- **Remote URL:** `https://github.com/Hoangjunss/app_7eleven.git`
- **Default Branch:** `main`

## 2. Branching Strategy (Professional Workflow)

For this project, we will adopt a **simplified Git Flow** to keep things organized without over-engineering it for a solo developer. This involves having a main development branch and using clear, short-lived feature branches.

### 2.1. Core Branches
- **`main`**: The production-ready branch. Only code that is tested and ready for deployment is merged here. **No direct commits are allowed to `main`**.
- **`develop`**: The main integration branch. All new features, bug fixes, and chores are merged here first. This branch always reflects the latest state of development.

### 2.2. Supporting Branches (Temporary)
All work is done on short-lived branches that branch off from `develop`. The naming convention follows a clear prefix.

#### Feature Branches (`feature/...`)
Used for developing new features.
- **Naming:** `feature/short-description`
- **Examples:**
    - `feature/product-crud`
    - `feature/user-authentication`
    - `feature/order-status-update`
- **Source Branch:** `develop`
- **Target Branch:** `develop`

#### Bugfix Branches (`bugfix/...`)
Used for fixing non-critical bugs found during development.
- **Naming:** `bugfix/short-description`
- **Examples:**
    - `bugfix/fix-login-error`
    - `bugfix/correct-pagination`
- **Source Branch:** `develop`
- **Target Branch:** `develop`

#### Chore Branches (`chore/...`)
Used for tasks that don't change business logic, like refactoring, updating dependencies, or configuration.
- **Naming:** `chore/short-description`
- **Examples:**
    - `chore/update-spring-boot-version`
    - `chore/refactor-audit-aspect`
- **Source Branch:** `develop`
- **Target Branch:** `develop`

#### Hotfix Branches (`hotfix/...`)
For urgent fixes in the production (`main`) branch.
- **Naming:** `hotfix/critical-bug-description`
- **Examples:**
    - `hotfix/fix-payment-processing-crash`
    - `hotfix/resolve-cart-issue`
- **Source Branch:** `main`
- **Target Branch:** Both `main` and `develop` (merge back to both).

## 3. The Definitive Workflow (Git Commands)

This is the exact sequence of commands you should follow for each task.

### 3.1. Starting a New Task (e.g., a new feature)
Always start by updating your local `develop` branch.
```bash
# 1. Switch to the 'develop' branch
git checkout develop

# 2. Pull the latest changes from the remote 'develop' branch
git pull origin develop

# 3. Create a new feature branch (change the name as needed)
git checkout -b feature/short-description
3.2. While Working
After completing a logical, small chunk of work, commit the changes.

bash
# View the changes you made
git status

# Stage the specific file(s) or all changes
git add .

# Commit with a meaningful message
git commit -m "feat(product): add CRUD endpoints for admin"

# Keep repeating until the feature is complete
3.3. Finishing a Task (Merging back to develop)
Once the feature is complete and tested locally, it's time to integrate it.

bash
# 1. Switch to the 'develop' branch
git checkout develop

# 2. Ensure your 'develop' is up-to-date (in case of any updates)
git pull origin develop

# 3. Merge your feature branch into 'develop'
git merge feature/short-description

# 4. Push the updated 'develop' branch to the remote repository
git push origin develop

# 5. (Optional, but good practice) Delete the local feature branch
git branch -d feature/short-description
3.4. Releasing to Production (Merging to main)
After a significant milestone (e.g., end of Day 5 for the MVP), you will merge the develop branch into main.

bash
# 1. Switch to the 'main' branch
git checkout main

# 2. Pull the latest to ensure you're up to date
git pull origin main

# 3. Merge the 'develop' branch into 'main'
git merge develop

# 4. Push the updated 'main' branch to the remote repository
git push origin main
4. Rules of the Road (Do's and Don'ts)
NO Direct Commits to main. Always merge main from develop or, in rare cases, from a hotfix/... branch.

Keep Branches Short-Lived. Delete the branch after merging.

Make Small, Logical Commits. It's better to have 10 small commits than 1 giant one.

Always pull before you push to avoid conflicts.

Write Meaningful Commit Messages. Use the Conventional Commits format: <type>(<scope>): <subject>. (e.g., feat(product): add search functionality).

5. Branch & Commit Conventions
5.1. Branch Prefixes
Follow this table for all temporary branches.

Branch Type	Prefix	Example
Feature	feature/	feature/admin-product-list
Bugfix	bugfix/	bugfix/stock-update-error
Chore	chore/	chore/optimize-dockerfile
Hotfix	hotfix/	hotfix/fix-cart-issue
5.2. Commit Messages (Conventional Commits)
We follow the Conventional Commits standard. This makes the history readable and allows for automation later.

Format: <type>(<scope>): <subject>

Type	When to Use
feat	A new feature for the user (e.g., feat(order): add order creation api)
fix	A bug fix (e.g., fix(cart): resolve quantity update issue)
docs	Documentation only changes (e.g., docs: update git workflow guide)
chore	Changes to the build process or auxiliary tools (e.g., chore: upgrade spring boot version)
refactor	A code change that neither fixes a bug nor adds a feature (e.g., refactor: rename core service package)
test	Adding missing tests or correcting existing tests (e.g., test: add unit tests for ProductService)
5.3. Examples of Good Commits
feat(product): create CRUD endpoints for admin

feat(product): add search and filter functionality

fix(order): correct stock update optimistic lock

chore(docker): add postgres and redis services

chore(deps): add MapStruct and JWT dependencies

docs(readme): update project setup instructions

6. Setting Up the Repository (Initial Setup)
If this is the first time you are setting up the repository, perform these steps:

bash
# 1. Initialize a new Git repository in the project root
git init

# 2. Add the remote origin
git remote add origin https://github.com/Hoangjunss/app_7eleven.git

# 3. Create the initial 'develop' branch and 'main' branch
git checkout -b main
git checkout -b develop

# 4. Add all your initial files (e.g., from Spring Initializr)
git add .

# 5. Make the first commit on the 'develop' branch
git commit -m "chore: initial commit with Spring Boot 3.2.11 dependencies"

# 6. Push both branches to the remote repository
git push -u origin develop
git push origin main
7. What NOT to Commit (Check .gitignore)
Ensure the .gitignore file is in your root directory and contains these entries to prevent committing sensitive or unnecessary files:

text
# Environment files
.env.dev
.env.prod

# Java / Maven build outputs
target/
*.jar
*.war
*.ear

# Node modules (for future frontend)
node_modules/
.next/

# IDE specific files
.idea/
.vscode/
*.iml

# Logs
*.log
logs/

# Application generated files
backend/uploads/
8. AI Automation Rules
When the AI is asked to perform Git operations, it must adhere to these rules:

Never commit sensitive data – check staged files for any secrets or credentials.

Write meaningful commit messages strictly following the Conventional Commits format.

Commit in small, logical chunks – avoid committing all changes in one giant commit.

Always pull the latest version of the target branch before pushing to avoid conflicts.

If a merge conflict arises, stop immediately and ask the user to resolve it manually.

Never force push (git push --force) to main or develop branches.

9. Example AI Command
"AI, commit the current changes on the 'feature/audit-aspect' branch with the message: feat(audit): implement AOP for logging user actions and push the branch to the remote repository."

The AI will then understand to execute:

bash
git add src/main/java/com/_eleven/shop/aspect/AuditAspect.java
git commit -m "feat(audit): implement AOP for logging user actions"
git push origin feature/audit-aspect
10. Pre-Commit Checklist
Before making any commit, quickly review this list:

Did you run git status to see what is being committed?

Are any .env or secret files accidentally staged?

Is the commit message clear, in English, and following the type(scope): subject convention?

Did you pull the latest changes from the target branch?

Does the code compile? (For MVP, manual check is sufficient).

This file should remain in the repository root to guide both human and AI contributors.

