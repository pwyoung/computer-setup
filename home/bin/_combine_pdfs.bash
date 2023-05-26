#!/bin/bash

# Works (without -dPDFSETTINGS=/prepress)
# gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile=temp.pdf file1.pdf ./file2.pdf

# gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -sOutputFile=merged.pdf mine1.pdf mine2.pdf

# Works
gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress -sOutputFile=merged.pdf first-county-1.pdf first-county-2.pdf
