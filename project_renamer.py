#!/bin/python3

import os

def replace_in_files(directory, target, replacement, ignored_directories=[]):
    for dirpath, dirnames, filenames in os.walk(directory):
        dirnames[:] = [d for d in dirnames if d not in ignored_directories]
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            with open(file_path, 'r') as file:
                content = file.read()
            content = content.replace(target, replacement)
            with open(file_path, 'w') as file:
                file.write(content)

directory = './'

# Prompt NEW_PROJECT_NAME
NEW_PROJECT_NAME = input("Enter new name without Aeb.* prefix (Example: NewNameService): ")

ignored_directories = ['.idea', 'node_modules']
target = 'THIS_APPLICATION_NAME_INSERTION_POINT'
replacement = NEW_PROJECT_NAME
replace_in_files(directory, target, replacement, ignored_directories)
