#!/bin/bash

# Version management script

VERSION_FILE="version.txt"
CHANGELOG_FILE="CHANGELOG.md"

function get_current_version() {
    if [ -f "$VERSION_FILE" ]; then
        cat "$VERSION_FILE"
    else
        echo "0.1.0"
    fi
}

function bump_version() {
    local current_version=$(get_current_version)
    local version_type=$1
    local branch_name=$2

    # Extract version components
    local major=$(echo $current_version | cut -d. -f1)
    local minor=$(echo $current_version | cut -d. -f2)
    local patch=$(echo $current_version | cut -d. -f3 | cut -d- -f1 | cut -d+ -f1)

    case $version_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
    esac

    local new_version="$major.$minor.$patch"

    # Add suffix based on branch
    case $branch_name in
        alpha*)
            local alpha_num=1
            if [[ $current_version == *"-alpha"* ]]; then
                alpha_num=$(($(echo $current_version | cut -d. -f4) + 1))
            fi
            new_version="$new_version-alpha.$alpha_num"
            ;;
        release/*)
            local rc_num=1
            if [[ $current_version == *"-rc"* ]]; then
                rc_num=$(($(echo $current_version | cut -d. -f4) + 1))
            fi
            new_version="$new_version-rc.$rc_num"
            ;;
        hotfix/*)
            new_version="$new_version+hotfix.1"
            ;;
    esac

    echo $new_version
}

function update_version() {
    local new_version=$1
    echo $new_version > $VERSION_FILE
}

function update_changelog() {
    local version=$1
    local message=$2
    local date=$(date +%Y-%m-%d)
    
    if [ ! -f "$CHANGELOG_FILE" ]; then
        echo "# Changelog" > $CHANGELOG_FILE
        echo "" >> $CHANGELOG_FILE
    fi

    # Prepend new version to changelog
    local tmp_file=$(mktemp)
    echo "## [$version] - $date" > $tmp_file
    echo "$message" >> $tmp_file
    echo "" >> $tmp_file
    cat $CHANGELOG_FILE >> $tmp_file
    mv $tmp_file $CHANGELOG_FILE
}

# Main execution
case $1 in
    get)
        get_current_version
        ;;
    bump)
        new_version=$(bump_version $2 $3)
        update_version $new_version
        echo $new_version
        ;;
    changelog)
        update_changelog $2 "$3"
        ;;
    *)
        echo "Usage: $0 {get|bump|changelog}"
        exit 1
        ;;
esac
