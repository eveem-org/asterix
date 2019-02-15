COLOR_HEADER = '\033[95m'
COLOR_BLUE = '\033[94m'
COLOR_OKGREEN = '\033[92m'
COLOR_WARNING = '\033[93m'
FAIL = '\033[91m'
ENDC = '\033[0m'
COLOR_BOLD = '\033[1m'
COLOR_UNDERLINE = '\033[4m'
COLOR_GREEN = '\033[32m'
COLOR_GRAY = '\033[38;5;8m'

def opcode(exp):
    if type(exp) != list:
        return None
    else:
        return str(exp[0] if len(exp)>0 else None)


def format_exp(exp):
    if type(exp) == str:
        return f'"{exp}"'
    if type(exp) == int:
        if exp > 10**6 and exp % 10**6 != 0:
            return hex(exp)
        else:
            return str(exp) 
    elif type(exp) != list:
        return str(exp)
    else:
        if len(exp) == 0:
            return COLOR_GRAY + '[]'+ENDC
        if type(opcode(exp)) == list:
            return COLOR_GRAY + '[' + ENDC + f'{COLOR_GRAY},{ENDC}'.join([format_exp(e) for e in exp]) + COLOR_GRAY+']'+ENDC
        else:
            return COLOR_GRAY + '[' + ENDC + f'{COLOR_GRAY},{ENDC}'.join([opcode(exp)] + [format_exp(e) for e in exp[1:]]) + COLOR_GRAY+']'+ENDC
