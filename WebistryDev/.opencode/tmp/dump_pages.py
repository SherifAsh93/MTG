import pymupdf

d = pymupdf.open(r"D:\Work\WebistryDev\.opencode\tmp\qoya-44.pdf")
rooms = {"SALON": (4, 18), "LIVING": (20, 26), "DINING": (28, 35), "BEDROOM": (37, 43)}

for room, (a, b) in rooms.items():
    print(f"########## {room}  (p{a}-{b}, {b - a + 1} sets) ##########")
    for p in range(a, b + 1):
        print(f"--- p{p} ---")
        print(d[p - 1].get_text().strip())
        print()
