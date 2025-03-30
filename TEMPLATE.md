## Cherry-picking a Commit from Another Repository

If you want to cherry-pick a commit from a different repository, follow these steps!

### 1. Add the remote repository:

```bash
git remote add foss-weekend https://github.com/MrImmortal09/FOSS-Weekend-2024-Leaderboard.git
```

### 2. Fetch the changes:

```bash
git fetch foss-weekend
```

### 3. Cherry-pick the commit:

```bash
git cherry-pick 6e956da599182e604a284d5af7e69632a0db2b6f
```

### 4. Push the changes (if needed):

```bash
git push origin <your-branch>
```

Replace `<your-branch>` with your actual branch name. If there are conflicts, resolve them and continue:

```bash
git cherry-pick --continue
```

Now your commit is applied to your repo! 🚀
