# ANSWERS

## 1. Docker vs containerd
Docker is a full platform for building and running containers, including CLI tools and image building. Containerd is a lower-level runtime focused only on running containers. Kubernetes interacts directly with container runtimes, so Kind uses containerd because it is lightweight and efficient.

## 2. imagePullPolicy: Never
It is set to Never because the image is built locally and manually loaded into the Kind cluster. Kubernetes should not try to pull it from a remote registry.

## 3. Remote cluster changes
You would need to push the Docker image to a container registry, update the image reference in the deployment, and configure access to the remote cluster (kubeconfig and credentials).

## 4. Self-hosted vs GitHub-hosted runners
Self-hosted runners can access local resources like a Kind cluster and give more control. However, they require manual setup and must stay online. GitHub-hosted runners are easier to use but cannot access local environments.
