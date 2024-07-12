import sys
import cv2
import numpy as np

try:

    # Get the filename from the command-line arguments
    filename = sys.argv[1]
    # print(filename)
    filename='public/'+filename

    # Load the image
    image = cv2.imread(filename)

    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Threshold the image
    _, thresholded = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)

    # Find contours in the thresholded image
    contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Find the largest contour
    largest_contour = max(contours, key=cv2.contourArea)

    # Get the bounding rectangle for the largest contour
    x, y, w, h = cv2.boundingRect(largest_contour)

    # Crop the image to this bounding rectangle
    cropped = image[y:y+h, x:x+w]

    # Overwrite the original image file with the cropped image
    cv2.imwrite(filename, cropped)

    # Print the path to the processed image
    print(filename)
except Exception as e:
    print(f"Error: {str(e)}")
    sys.exit(1) 