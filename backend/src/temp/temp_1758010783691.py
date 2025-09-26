
# Input values
input_values = ["1","2","3"]

# Define a class for the binary tree node
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

# Function to calculate sum of all nodes
def sum_of_nodes(root):
    if root is None:
        return 0
    return root.val + sum_of_nodes(root.left) + sum_of_nodes(root.right)

# Sample tree:
#        5
#       / \
#      3   8
#     / \   \
#    1   4   10

root = TreeNode(5)
root.left = TreeNode(3)
root.right = TreeNode(8)
root.left.left = TreeNode(1)
root.left.right = TreeNode(4)
root.right.right = TreeNode(10)

# Calculate sum
print("Sum of all nodes:", sum_of_nodes(root))


# Try to call main functions with input
try:
    if 'add' in locals() and len(input_values) >= 2:
        result = add(int(input_values[0]), int(input_values[1]))
        print(result)
    elif 'factorial' in locals() and len(input_values) >= 1:
        result = factorial(int(input_values[0]))
        print(result)
    elif 'main' in locals():
        main()
except Exception as e:
    pass
