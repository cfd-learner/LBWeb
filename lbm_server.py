#!/usr/bin/env python
import subprocess
import SimpleHTTPServer
import SocketServer
import os
import json
import threading
import time
import tempfile
from datetime import datetime
import StringIO
import gzip

class LBM_manager(object):
    def __init__(self, num, input_filename, every):
        self.num = num
        self.lbm_proc = subprocess.Popen(["mpirun", "-n", "3", "./lbm", "-a", "/dev/null", "-f", "/dev/null", "-p", input_filename, "-s", every], stdout=subprocess.PIPE, bufsize=1024*1024*128)
        self.iteration = -1
        self.iteration_content = ""
        self.last_access = datetime.now()

    def fetch_iteration(self, iteration):
        self.last_access = datetime.now()
        if self.iteration > iteration:
            return -1;
        if self.iteration == iteration:
            return self.iteration_content
        while self.lbm_proc.returncode is None:
            out = self.lbm_proc.stdout.readline()
            parts = out.split(":")
            if parts[0].startswith("iteration "):
                self.iteration = int(parts[0][10:])
                self.iteration_content = parts[1].strip().decode('hex').encode('base64')
                print(parts[0], self.iteration, iteration)
                if self.iteration > iteration:
                    return -2
                if self.iteration == iteration:
                    return self.iteration_content
            self.lbm_proc.poll()
        return -3

    def is_dead(self):
        return (self.lbm_proc.returncode is not None) or (datetime.now() - self.last_access).total_seconds() > 60;

    def death_reason(self):
        if self.lbm_proc.returncode is not None:
            return "Process has exited %i" % self.lbm_proc.returncode
        return "Inactivity"

    def stop(self):
        if self.lbm_proc.returncode is None:
            self.lbm_proc.terminate()
        self.lbm_proc.stdout.close()

my_lock = threading.Lock()

lbm_number = 0
lbm_dict = {}
def create_lbm(file, iter_step):
    check_lbm()
    global lbm_number, lbm_dict
    print("Creating LBM for %s every %s" % (file, iter_step))
    my_lock.acquire()
    my_number = lbm_number
    lbm_dict[my_number] = LBM_manager(my_number, file, iter_step)
    lbm_number += 1
    my_lock.release()
    return my_number

def check_lbm():
    my_lock.acquire()
    for lbm in lbm_dict.values():
        if lbm.is_dead():
            print("LBM %i abandoned: %s" % (lbm.num, lbm.death_reason()))
            lbm.stop()
            del lbm_dict[lbm.num]
    my_lock.release()

class CustomHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    def gzipencode(self, content):
        out = StringIO.StringIO()
        f = gzip.GzipFile(fileobj=out, mode='w', compresslevel=5)
        f.write(content)
        f.close()
        return out.getvalue()

    def do_GET(self):
        try:
            path_parts = self.path.split("/");
            if len(path_parts) == 1 or len(path_parts) > 4:
                self.send_response(404);
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                return
            my_id = int(path_parts[1])
            my_iter = int(path_parts[2])
            my_lbm = lbm_dict[my_id]
            iteration = my_lbm.fetch_iteration(my_iter)
            if isinstance(iteration, int):
                self.send_response(404 + iteration)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                return
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            pre_content = json.dumps({'data':iteration})
            content = self.gzipencode(pre_content)
            self.send_header("Content-length", str(len(str(content))))
            self.send_header("Content-Encoding", "gzip")
            self.end_headers()
            self.wfile.write(content)
            self.wfile.flush()
            print("Encoded %i bytes to %i (%.2f%%)" % (len(pre_content), len(content), 100 -(100*len(content)/float(len(pre_content)))))
        except Exception as e:
            print(e)
    def do_POST(self):
        path_parts = self.path.split("/");
        print(path_parts)
        if len(path_parts) == 1 or len(path_parts) > 4:
            self.send_response(404);
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            return
        content_len = int(self.headers.getheader('content-length', 0))
        post_body = self.rfile.read(content_len)
        file_handle, file_name = tempfile.mkstemp()
        os.write(file_handle, post_body)
        if path_parts[1] == "create":
            my_id = create_lbm(file_name, path_parts[2])
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            json.dump({'id': my_id}, self.wfile)
            return


def run_forever():
    handler = CustomHandler
    httpd = SocketServer.TCPServer(("", 8081), handler)
    httpd.serve_forever()

if __name__ == '__main__':
    run_forever()