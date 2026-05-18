// Algorithm Step Generators for Remotion Video Visualizations

export function generateBubbleSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  let tempArr = [...arr];

  steps.push({
    activeNode: null,
    description: `Initial Array: [${tempArr.join(', ')}]. Let's start Bubble Sort!`,
    arrayState: [...tempArr]
  });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        activeNode: j,
        targetNode: j + 1,
        description: `Compare element ${tempArr[j]} and ${tempArr[j+1]}.`,
        arrayState: [...tempArr]
      });

      if (tempArr[j] > tempArr[j + 1]) {
        const temp = tempArr[j];
        tempArr[j] = tempArr[j + 1];
        tempArr[j + 1] = temp;

        steps.push({
          activeNode: j,
          targetNode: j + 1,
          description: `Since ${temp} > ${tempArr[j]}, swap them!`,
          arrayState: [...tempArr]
        });
      } else {
        steps.push({
          activeNode: j,
          targetNode: j + 1,
          description: `Since ${tempArr[j]} <= ${tempArr[j+1]}, no swap needed.`,
          arrayState: [...tempArr]
        });
      }
    }
    steps.push({
      activeNode: null,
      description: `End of Pass ${i + 1}. Element ${tempArr[n - i - 1]} bubbled to index ${n - i - 1}.`,
      arrayState: [...tempArr]
    });
  }

  steps.push({
    activeNode: null,
    description: `Bubble Sort Complete! Sorted Array: [${tempArr.join(', ')}]`,
    arrayState: [...tempArr]
  });

  return steps;
}

export function generateSelectionSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  let tempArr = [...arr];

  steps.push({
    activeNode: null,
    description: `Initial Array: [${tempArr.join(', ')}]. Let's start Selection Sort!`,
    arrayState: [...tempArr]
  });

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    steps.push({
      activeNode: i,
      description: `Pass ${i + 1}: Assume minimum is at index ${i} (value: ${tempArr[i]}).`,
      arrayState: [...tempArr]
    });

    for (let j = i + 1; j < n; j++) {
      steps.push({
        activeNode: j,
        targetNode: minIdx,
        description: `Compare index ${j} (${tempArr[j]}) with current minimum (${tempArr[minIdx]}).`,
        arrayState: [...tempArr]
      });

      if (tempArr[j] < tempArr[minIdx]) {
        minIdx = j;
        steps.push({
          activeNode: j,
          targetNode: minIdx,
          description: `Found smaller! New minimum index is ${minIdx} (value: ${tempArr[minIdx]}).`,
          arrayState: [...tempArr]
        });
      }
    }

    if (minIdx !== i) {
      const temp = tempArr[i];
      tempArr[i] = tempArr[minIdx];
      tempArr[minIdx] = temp;
      steps.push({
        activeNode: i,
        targetNode: minIdx,
        description: `Swap index ${i} (${temp}) with minimum index ${minIdx} (${tempArr[i]}).`,
        arrayState: [...tempArr]
      });
    } else {
      steps.push({
        activeNode: i,
        description: `Minimum is already at index ${i}. No swap needed.`,
        arrayState: [...tempArr]
      });
    }
  }

  steps.push({
    activeNode: null,
    description: `Selection Sort Complete! Sorted Array: [${tempArr.join(', ')}]`,
    arrayState: [...tempArr]
  });

  return steps;
}

export function generateInsertionSortSteps(arr) {
  const steps = [];
  const n = arr.length;
  let tempArr = [...arr];

  steps.push({
    activeNode: null,
    description: `Initial Array: [${tempArr.join(', ')}]. Let's start Insertion Sort!`,
    arrayState: [...tempArr]
  });

  for (let i = 1; i < n; i++) {
    const key = tempArr[i];
    let j = i - 1;

    steps.push({
      activeNode: i,
      description: `Pick key = ${key} at index ${i}. Insert into sorted subarray [0...${i - 1}].`,
      arrayState: [...tempArr]
    });

    while (j >= 0 && tempArr[j] > key) {
      steps.push({
        activeNode: j,
        targetNode: j + 1,
        description: `Since ${tempArr[j]} > key (${key}), shift ${tempArr[j]} right.`,
        arrayState: [...tempArr]
      });

      tempArr[j + 1] = tempArr[j];
      j--;

      steps.push({
        activeNode: j + 1,
        description: `Subarray shifted: [${tempArr.join(', ')}]`,
        arrayState: [...tempArr]
      });
    }

    tempArr[j + 1] = key;
    steps.push({
      activeNode: j + 1,
      description: `Insert key ${key} at sorted position index ${j + 1}.`,
      arrayState: [...tempArr]
    });
  }

  steps.push({
    activeNode: null,
    description: `Insertion Sort Complete! Sorted Array: [${tempArr.join(', ')}]`,
    arrayState: [...tempArr]
  });

  return steps;
}

export function generateMergeSortSteps(arr) {
  const steps = [];
  let tempArr = [...arr];

  steps.push({
    activeNode: null,
    description: `Initial Array: [${tempArr.join(', ')}]. Let's start Merge Sort!`,
    arrayState: [...tempArr]
  });

  function mergeSort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);

    const leftRange = Array.from({ length: m - l + 1 }, (_, idx) => l + idx);
    const rightRange = Array.from({ length: r - m }, (_, idx) => m + 1 + idx);

    steps.push({
      activeNode: m,
      description: `Split subarray [index ${l} to ${r}] into Left [${l}...${m}] and Right [${m + 1}...${r}].`,
      arrayState: [...tempArr],
      leftIndices: leftRange,
      rightIndices: rightRange
    });

    mergeSort(l, m);
    mergeSort(m + 1, r);
    merge(l, m, r);
  }

  function merge(l, m, r) {
    const leftArr = tempArr.slice(l, m + 1);
    const rightArr = tempArr.slice(m + 1, r + 1);

    const leftRange = Array.from({ length: m - l + 1 }, (_, idx) => l + idx);
    const rightRange = Array.from({ length: r - m }, (_, idx) => m + 1 + idx);

    steps.push({
      activeNode: l,
      targetNode: r,
      description: `Merge sub-arrays: Left [${leftArr.join(', ')}] and Right [${rightArr.join(', ')}].`,
      arrayState: [...tempArr],
      leftIndices: leftRange,
      rightIndices: rightRange
    });

    let i = 0, j = 0, k = l;
    while (i < leftArr.length && j < rightArr.length) {
      steps.push({
        activeNode: l + i,
        targetNode: m + 1 + j,
        description: `Compare ${leftArr[i]} (Left) and ${rightArr[j]} (Right).`,
        arrayState: [...tempArr],
        leftIndices: leftRange,
        rightIndices: rightRange
      });

      if (leftArr[i] <= rightArr[j]) {
        tempArr[k] = leftArr[i];
        steps.push({
          activeNode: k,
          description: `Place smaller value ${leftArr[i]} in position index ${k}.`,
          arrayState: [...tempArr],
          leftIndices: leftRange,
          rightIndices: rightRange
        });
        i++;
      } else {
        tempArr[k] = rightArr[j];
        steps.push({
          activeNode: k,
          description: `Place smaller value ${rightArr[j]} in position index ${k}.`,
          arrayState: [...tempArr],
          leftIndices: leftRange,
          rightIndices: rightRange
        });
        j++;
      }
      k++;
    }

    while (i < leftArr.length) {
      tempArr[k] = leftArr[i];
      steps.push({
        activeNode: k,
        description: `Copy remaining left element ${leftArr[i]} to index ${k}.`,
        arrayState: [...tempArr],
        leftIndices: leftRange,
        rightIndices: rightRange
      });
      i++;
      k++;
    }

    while (j < rightArr.length) {
      tempArr[k] = rightArr[j];
      steps.push({
        activeNode: k,
        description: `Copy remaining right element ${rightArr[j]} to index ${k}.`,
        arrayState: [...tempArr],
        leftIndices: leftRange,
        rightIndices: rightRange
      });
      j++;
      k++;
    }

    steps.push({
      activeNode: null,
      description: `Merged sorted subarray: [${tempArr.slice(l, r + 1).join(', ')}].`,
      arrayState: [...tempArr]
    });
  }

  mergeSort(0, tempArr.length - 1);

  steps.push({
    activeNode: null,
    description: `Merge Sort Complete! Sorted Array: [${tempArr.join(', ')}]`,
    arrayState: [...tempArr]
  });

  return steps;
}

export function generateQuickSortSteps(arr) {
  const steps = [];
  let tempArr = [...arr];

  steps.push({
    activeNode: null,
    description: `Initial Array: [${tempArr.join(', ')}]. Let's start Quick Sort!`,
    arrayState: [...tempArr]
  });

  function quickSort(low, high) {
    if (low >= high) return;
    const pIdx = partition(low, high);
    quickSort(low, pIdx - 1);
    quickSort(pIdx + 1, high);
  }

  function partition(low, high) {
    const pivot = tempArr[high];
    steps.push({
      activeNode: high,
      description: `Choose rightmost element ${pivot} at index ${high} as Pivot.`,
      arrayState: [...tempArr],
      pivotIndex: high
    });

    let i = low - 1;
    const smallerIndices = [];
    const largerIndices = [];

    for (let j = low; j < high; j++) {
      steps.push({
        activeNode: j,
        targetNode: high,
        description: `Compare element ${tempArr[j]} with Pivot ${pivot}.`,
        arrayState: [...tempArr],
        pivotIndex: high,
        leftIndices: [...smallerIndices],
        rightIndices: [...largerIndices]
      });

      if (tempArr[j] < pivot) {
        i++;
        smallerIndices.push(i);
        const temp = tempArr[i];
        tempArr[i] = tempArr[j];
        tempArr[j] = temp;

        steps.push({
          activeNode: i,
          targetNode: j,
          description: `Since ${tempArr[i]} < pivot (${pivot}), swap with index ${i}.`,
          arrayState: [...tempArr],
          pivotIndex: high,
          leftIndices: [...smallerIndices],
          rightIndices: [...largerIndices]
        });
      } else {
        largerIndices.push(j);
      }
    }

    const temp = tempArr[i + 1];
    tempArr[i + 1] = tempArr[high];
    tempArr[high] = temp;

    steps.push({
      activeNode: i + 1,
      targetNode: high,
      description: `Place Pivot ${pivot} into its sorted position at index ${i + 1}.`,
      arrayState: [...tempArr],
      pivotIndex: i + 1
    });

    return i + 1;
  }

  quickSort(0, tempArr.length - 1);

  steps.push({
    activeNode: null,
    description: `Quick Sort Complete! Sorted Array: [${tempArr.join(', ')}]`,
    arrayState: [...tempArr]
  });

  return steps;
}

export function generateBinarySearchSteps(arr, target) {
  const steps = [];
  const sortedArr = [...arr].sort((a, b) => a - b);

  steps.push({
    activeNode: null,
    description: `Searching for target ${target} in sorted array: [${sortedArr.join(', ')}]`,
    arrayState: [...sortedArr],
    lowIndex: 0,
    highIndex: sortedArr.length - 1,
    midIndex: -1
  });

  let low = 0;
  let high = sortedArr.length - 1;
  let found = false;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);

    steps.push({
      activeNode: mid,
      description: `Set search bounds: [index ${low} to ${high}]. Calculate mid = index ${mid} (val: ${sortedArr[mid]}).`,
      arrayState: [...sortedArr],
      lowIndex: low,
      highIndex: high,
      midIndex: mid
    });

    if (sortedArr[mid] === target) {
      steps.push({
        activeNode: mid,
        description: `Compare mid ${sortedArr[mid]} with target ${target}. Target found at index ${mid}!`,
        arrayState: [...sortedArr],
        lowIndex: low,
        highIndex: high,
        midIndex: mid,
        isFound: true
      });
      found = true;
      break;
    } else if (sortedArr[mid] < target) {
      const oldMid = mid;
      low = mid + 1;
      steps.push({
        activeNode: oldMid,
        description: `Since ${sortedArr[oldMid]} < ${target}, prune left half! Set low = mid + 1 = index ${low}.`,
        arrayState: [...sortedArr],
        lowIndex: low,
        highIndex: high,
        midIndex: oldMid
      });
    } else {
      const oldMid = mid;
      high = mid - 1;
      steps.push({
        activeNode: oldMid,
        description: `Since ${sortedArr[oldMid]} > ${target}, prune right half! Set high = mid - 1 = index ${high}.`,
        arrayState: [...sortedArr],
        lowIndex: low,
        highIndex: high,
        midIndex: oldMid
      });
    }
  }

  if (!found) {
    steps.push({
      activeNode: null,
      description: `Target ${target} was not found in the array.`,
      arrayState: [...sortedArr],
      lowIndex: low,
      highIndex: high,
      midIndex: -1
    });
  }

  return steps;
}

export function generateBSTInsertSteps(val) {
  const steps = [];
  
  steps.push({
    activeNode: 8,
    description: `Start at root (8). Inserting value ${val}...`,
    highlightNodes: []
  });

  if (val === 8) {
    steps.push({
      activeNode: 8,
      description: `Value ${val} equals root node (8). BSTs typically omit duplicates.`,
      highlightNodes: [8]
    });
    return steps;
  }

  let curr = 8;
  const path = [8];

  while (true) {
    if (val < curr) {
      if (curr === 8) {
        steps.push({
          activeNode: 8,
          targetNode: 4,
          description: `Compare ${val} with 8. Since ${val} < 8, go left to Node 4.`,
          highlightNodes: [...path]
        });
        curr = 4;
        path.push(4);
      } else if (curr === 4) {
        steps.push({
          activeNode: 4,
          targetNode: 2,
          description: `Compare ${val} with 4. Since ${val} < 4, go left to Node 2.`,
          highlightNodes: [...path]
        });
        curr = 2;
        path.push(2);
      } else if (curr === 2) {
        steps.push({
          activeNode: 2,
          description: `Compare ${val} with 2. Left pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      } else if (curr === 6) {
        steps.push({
          activeNode: 6,
          description: `Compare ${val} with 6. Left pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      } else if (curr === 12) {
        steps.push({
          activeNode: 12,
          targetNode: 10,
          description: `Compare ${val} with 12. Since ${val} < 12, go left to Node 10.`,
          highlightNodes: [...path]
        });
        curr = 10;
        path.push(10);
      } else if (curr === 10) {
        steps.push({
          activeNode: 10,
          description: `Compare ${val} with 10. Left pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      } else if (curr === 14) {
        steps.push({
          activeNode: 14,
          description: `Compare ${val} with 14. Left pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      }
    } else {
      if (curr === 8) {
        steps.push({
          activeNode: 8,
          targetNode: 12,
          description: `Compare ${val} with 8. Since ${val} > 8, go right to Node 12.`,
          highlightNodes: [...path]
        });
        curr = 12;
        path.push(12);
      } else if (curr === 12) {
        steps.push({
          activeNode: 12,
          targetNode: 14,
          description: `Compare ${val} with 12. Since ${val} > 12, go right to Node 14.`,
          highlightNodes: [...path]
        });
        curr = 14;
        path.push(14);
      } else if (curr === 14) {
        steps.push({
          activeNode: 14,
          description: `Compare ${val} with 14. Right pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      } else if (curr === 4) {
        steps.push({
          activeNode: 4,
          targetNode: 6,
          description: `Compare ${val} with 4. Since ${val} > 4, go right to Node 6.`,
          highlightNodes: [...path]
        });
        curr = 6;
        path.push(6);
      } else if (curr === 6) {
        steps.push({
          activeNode: 6,
          description: `Compare ${val} with 6. Right pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      } else if (curr === 10) {
        steps.push({
          activeNode: 10,
          description: `Compare ${val} with 10. Right pointer is empty, attach new Node(${val}) here!`,
          highlightNodes: [...path],
          isFound: true
        });
        break;
      }
    }
  }

  return steps;
}
