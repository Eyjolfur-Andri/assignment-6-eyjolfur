# Assignment 5 Answers

## 1. What is the difference between Docker and containerd? Why does Kind use containerd under the hood?

Docker is basically the tool most people use when working with containers. It does a lot of things in one place — building images, running them, checking logs, handling networks, etc. So it’s kind of the “full package”.

containerd is more simple and lower level. It mainly just runs containers and handles things like pulling images and execution. It doesn’t have all the extra features Docker has.

Kind uses containerd because it only really needs the runtime part. Kubernetes already works with container runtimes, so using containerd keeps things simpler. Also from what I understand, it’s closer to how real Kubernetes setups are run in production.


## 2. Why does the deployment use imagePullPolicy: Never?

In this case the image is built locally and then loaded into the Kind cluster manually.

Because of that, Kubernetes should not try to download the image from a registry. It just needs to use the one that is already there. That’s why imagePullPolicy is set to Never.

When I tested it without that setting, it actually tried to pull the image and failed, since it doesn’t exist in any remote registry.


## 3. What would need to change if you wanted to deploy to a remote Kubernetes cluster instead of a local one?

The biggest change is that the image can’t stay local anymore. You would need to push it to some registry (like Docker Hub or something similar) so the cluster can access it.

You’d also need to make sure kubectl is pointing to the correct cluster, not the local Kind one. And the deployment file needs to reference the correct image name and tag.

Another thing is how the app is exposed. NodePort works fine locally, but for a real cluster you would usually use something like a LoadBalancer or Ingress instead.


## 4. What are the advantages and disadvantages of using a self-hosted runner compared to GitHub-hosted runners?

From doing this assignment, a self-hosted runner was useful because it could connect directly to the local setup (like the Kind cluster). That’s something a GitHub-hosted runner wouldn’t really be able to do.

The advantage is that you have full control. You can install whatever you need and set it up exactly how you want.

But at the same time, that also means more responsibility. If something stops working, you have to fix it yourself, which can be a bit annoying.

GitHub-hosted runners are easier to use overall. You don’t really worry about setup, they just run your workflow in a clean environment every time. But they are also more limited.

So I think it depends on what you need. For simple things GitHub-hosted is probably enough, but for something like this assignment, self-hosted made more sense.
