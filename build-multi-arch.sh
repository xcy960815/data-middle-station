#!/bin/bash

# Default values
IMAGE_NAME="xcy960815/data-middle-station"
TAG="latest"
PLATFORMS="linux/amd64,linux/arm64"
PUSH=false

# Help function
show_help() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -t, --tag <tag>          Specify the image tag (default: latest)"
    echo "  -p, --platforms <list>   Specify platforms (default: linux/amd64,linux/arm64)"
    echo "  -n, --name <name>        Specify image name (default: xcy960815/data-middle-station)"
    echo "  --push                   Push the image to the registry"
    echo "  -h, --help               Show this help message"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -p|--platforms)
            PLATFORMS="$2"
            shift 2
            ;;
        -n|--name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --push)
            PUSH=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "Building multi-arch image..."
echo "Image: $IMAGE_NAME:$TAG"
echo "Platforms: $PLATFORMS"
echo "Push to registry: $PUSH"

# Check if docker buildx is available
if ! docker buildx version > /dev/null 2>&1; then
    echo "Error: docker buildx is not available. Please install Docker Desktop or enable buildx."
    exit 1
fi

# Create a new builder instance if it doesn't exist
BUILDER_NAME="mybuilder"
if ! docker buildx inspect $BUILDER_NAME > /dev/null 2>&1; then
    echo "Creating new builder instance: $BUILDER_NAME"
    docker buildx create --name $BUILDER_NAME --use
else
    echo "Using existing builder instance: $BUILDER_NAME"
    docker buildx use $BUILDER_NAME
fi

# Bootstrap the builder
docker buildx inspect --bootstrap

# Build command
CMD="docker buildx build --platform $PLATFORMS -t $IMAGE_NAME:$TAG ."

if [ "$PUSH" = true ]; then
    CMD="$CMD --push"
fi

echo "Running command: $CMD"
eval $CMD
