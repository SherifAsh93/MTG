import sys
p = '/home/sherif/sites/Ahmed-Elakad/src/app/admin/dashboard/page.tsx'
s = open(p, encoding='utf-8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'

imp = 'import React, { useState, useEffect, useCallback, useRef, FormEvent } from "react";'
if s.count(imp) != 1:
    sys.exit('import anchor count=%d' % s.count(imp))
if 'AssistantPanel' not in s:
    s = s.replace(imp, imp + nl + 'import AssistantPanel from "./AssistantPanel";', 1)

end_anchor = '      </main>' + nl + '    </div>' + nl + '  );' + nl + '}'
if s.count(end_anchor) != 1:
    sys.exit('end anchor count=%d' % s.count(end_anchor))
if '<AssistantPanel />' not in s:
    s = s.replace(end_anchor, '      </main>' + nl + '      <AssistantPanel />' + nl + '    </div>' + nl + '  );' + nl + '}', 1)

open(p, 'w', encoding='utf-8', newline='').write(s)
print('edited ok')
